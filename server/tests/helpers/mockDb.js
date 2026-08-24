import mongoose from 'mongoose';
import User from '../../models/User.js';
import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';

// Prevent accidental live database connections during tests
const originalConnect = mongoose.connect.bind(mongoose);
mongoose.connect = async (url, options) => {
    if (typeof url === 'string' && (url.includes('mongodb.net') || url.includes('mongodb+srv'))) {
        throw new Error(`CRITICAL TEST GUARD: Prevented test from connecting to live MongoDB Atlas: ${url}`);
    }
    return mongoose;
};

// In-memory data store
let usersStore = new Map();
let conversationsStore = new Map();
let messagesStore = new Map();

// Helper to deep clone objects
const clone = (obj) => JSON.parse(JSON.stringify(obj));

// Helper to match Mongo ObjectIds / strings
const matchesId = (a, b) => {
    if (!a || !b) return false;
    const strA = typeof a === 'object' && a._id ? a._id.toString() : a.toString();
    const strB = typeof b === 'object' && b._id ? b._id.toString() : b.toString();
    return strA === strB;
};

// Chainable query helper
class MockQuery {
    constructor(promiseOrResolver) {
        this.resolver = typeof promiseOrResolver === 'function' ? promiseOrResolver : () => promiseOrResolver;
        this.populationPaths = [];
        this.selectedFields = null;
        this.isLean = false;
        this.sortOption = null;
        this.limitCount = undefined;
        this.skipCount = undefined;
        this._limit = undefined;
        this._skip = undefined;
    }

    populate(opts) {
        if (typeof opts === 'string') {
            this.populationPaths.push({ path: opts });
        } else if (typeof opts === 'object') {
            this.populationPaths.push(opts);
        }
        return this;
    }

    select(fields) {
        this.selectedFields = fields;
        return this;
    }

    lean() {
        this.isLean = true;
        return this;
    }

    sort(sortOption) {
        this.sortOption = sortOption;
        return this;
    }

    skip(skipCount) {
        this.skipCount = skipCount;
        this._skip = skipCount;
        return this;
    }

    limit(limitCount) {
        this.limitCount = limitCount;
        this._limit = limitCount;
        return this;
    }

    async exec() {
        return this.then((res) => res);
    }

    then(resolve, reject) {
        return Promise.resolve(this.resolver()).then((res) => {
            if (res === null || res === undefined) return resolve(res);
            if (typeof res === 'number') return resolve(res);
            let result = clone(res);

            // Apply populate
            result = applyPopulations(result, this.populationPaths);

            // Apply select
            if (this.selectedFields && typeof this.selectedFields === 'string') {
                const fieldNames = this.selectedFields.split(' ').filter(Boolean);
                if (Array.isArray(result)) {
                    result = result.map(item => filterFields(item, fieldNames));
                } else if (typeof result === 'object') {
                    result = filterFields(result, fieldNames);
                }
            }

            if (result && typeof result === 'object' && !Array.isArray(result) && result._id && messagesStore.has(result._id.toString())) {
                result.save = async function () {
                    const existing = messagesStore.get(this._id.toString()) || {};
                    const updated = {
                        ...existing,
                        content: this.content,
                        isDeleted: Boolean(this.isDeleted),
                        deletedAt: this.deletedAt || null,
                        isEdited: Boolean(this.isEdited),
                        editedAt: this.editedAt || null,
                        type: this.type || existing.type || 'text',
                        seenBy: (this.seenBy || existing.seenBy || []).map(s => s.toString())
                    };
                    messagesStore.set(this._id.toString(), updated);
                    return this;
                };
            }

            if (result && typeof result === 'object' && result.senderId && typeof result.senderId === 'string') {
                result.senderId = new mongoose.Types.ObjectId(result.senderId);
            }

            if (Array.isArray(result) && this.sortOption) {
                if (typeof this.sortOption === 'object') {
                    if (this.sortOption.createdAt === 1) {
                        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    } else if (this.sortOption.createdAt === -1) {
                        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    } else if (this.sortOption.fullName === 1) {
                        result.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
                    } else if (this.sortOption.fullName === -1) {
                        result.sort((a, b) => (b.fullName || '').localeCompare(a.fullName || ''));
                    }
                } else if (typeof this.sortOption === 'string') {
                    if (this.sortOption === 'createdAt') {
                        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    } else if (this.sortOption === '-createdAt') {
                        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    } else if (this.sortOption === 'fullName') {
                        result.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
                    } else if (this.sortOption === '-fullName') {
                        result.sort((a, b) => (b.fullName || '').localeCompare(a.fullName || ''));
                    }
                }
            }

            if (Array.isArray(result)) {
                const skipVal = typeof this.skipCount === 'number' ? this.skipCount : (typeof this._skip === 'number' ? this._skip : 0);
                const limitVal = typeof this.limitCount === 'number' ? this.limitCount : (typeof this._limit === 'number' ? this._limit : undefined);
                const start = Math.max(0, skipVal);
                if (limitVal !== undefined && limitVal >= 0) {
                    result = result.slice(start, start + limitVal);
                } else if (start > 0) {
                    result = result.slice(start);
                }
            }

            return resolve(result);
        }).catch(reject);
    }
}

function filterFields(item, fieldNames) {
    if (!item) return item;
    const isExclusion = fieldNames.some(f => f.startsWith('-'));
    if (isExclusion) {
        const copy = { ...item };
        fieldNames.forEach(f => {
            if (f.startsWith('-')) delete copy[f.slice(1)];
        });
        return copy;
    }
    const filtered = { _id: item._id };
    fieldNames.forEach(f => {
        if (item[f] !== undefined) filtered[f] = item[f];
    });
    return filtered;
}

function applyPopulations(result, populationPaths) {
    if (!result || populationPaths.length === 0) return result;

    if (Array.isArray(result)) {
        return result.map(item => applyPopulationsToDoc(item, populationPaths));
    }
    return applyPopulationsToDoc(result, populationPaths);
}

function applyPopulationsToDoc(doc, populationPaths) {
    if (!doc) return doc;
    for (const pop of populationPaths) {
        const path = pop.path;
        if (path === 'participants') {
            if (Array.isArray(doc.participants)) {
                doc.participants = doc.participants.map(pId => {
                    const u = usersStore.get(pId.toString());
                    if (!u) return pId;
                    const uDoc = { _id: u._id, fullName: u.fullName, picture: u.picture };
                    return uDoc;
                });
            }
        } else if (path === 'messages') {
            if (Array.isArray(doc.messages)) {
                doc.messages = doc.messages.map(mId => {
                    const m = messagesStore.get(mId.toString());
                    if (!m) return mId;
                    const mDoc = clone(m);
                    if (pop.populate && pop.populate.path === 'senderId') {
                        const s = usersStore.get(m.senderId.toString());
                        if (s) mDoc.senderId = { _id: s._id, fullName: s.fullName, picture: s.picture };
                    }
                    return mDoc;
                });
            }
        } else if (path === 'lastMessage') {
            if (doc.lastMessage) {
                const m = messagesStore.get(doc.lastMessage.toString());
                if (m) doc.lastMessage = clone(m);
            }
        } else if (path === 'senderId') {
            if (doc.senderId) {
                const s = usersStore.get(doc.senderId.toString());
                if (s) doc.senderId = { _id: s._id, fullName: s.fullName, picture: s.picture };
            }
        } else if (path === 'conversations.conversation') {
            if (Array.isArray(doc.conversations)) {
                doc.conversations = doc.conversations.map(entry => {
                    if (!entry || !entry.conversation) return entry;
                    const c = conversationsStore.get(entry.conversation.toString());
                    if (!c) return entry;
                    const cDoc = clone(c);
                    if (pop.populate && Array.isArray(pop.populate)) {
                        pop.populate.forEach(nestedPop => {
                            if (nestedPop.path === 'participants') {
                                cDoc.participants = (cDoc.participants || []).map(pId => {
                                    const u = usersStore.get(pId.toString());
                                    return u ? { _id: u._id, fullName: u.fullName, picture: u.picture } : pId;
                                });
                            } else if (nestedPop.path === 'lastMessage') {
                                if (cDoc.lastMessage) {
                                    const m = messagesStore.get(cDoc.lastMessage.toString());
                                    if (m) cDoc.lastMessage = clone(m);
                                }
                            }
                        });
                    }
                    return { ...entry, conversation: cDoc };
                });
            }
        }
    }
    return doc;
}

// Preserve original model methods
const origUserFindById = User.findById;
const origUserFindOne = User.findOne;
const origUserFind = User.find;
const origUserCreate = User.create;
const origUserUpdateMany = User.updateMany;
const origUserFindByIdAndUpdate = User.findByIdAndUpdate;
const origUserCountDocuments = User.countDocuments;

const origConvFindById = Conversation.findById;
const origConvFindOne = Conversation.findOne;
const origConvFind = Conversation.find;
const origConvCreate = Conversation.create;
const origConvFindByIdAndUpdate = Conversation.findByIdAndUpdate;
const origConvSave = Conversation.prototype.save;

const origMsgFindById = Message.findById;
const origMsgFind = Message.find;
const origMsgCreate = Message.create;
const origMsgUpdateMany = Message.updateMany;
const origMsgFindByIdAndUpdate = Message.findByIdAndUpdate;

function matchesUserFilter(user, query = {}) {
    if (!query || Object.keys(query).length === 0) return true;

    // _id checks
    if (query._id !== undefined) {
        if (typeof query._id === 'object' && query._id !== null && !(query._id instanceof mongoose.Types.ObjectId)) {
            if (query._id.$ne !== undefined) {
                if (matchesId(user._id, query._id.$ne)) return false;
            }
            if (query._id.$in !== undefined) {
                const inList = Array.isArray(query._id.$in) ? query._id.$in : [query._id.$in];
                if (!inList.some(id => matchesId(user._id, id))) return false;
            }
            if (query._id.$nin !== undefined) {
                const ninList = Array.isArray(query._id.$nin) ? query._id.$nin : [query._id.$nin];
                if (ninList.some(id => matchesId(user._id, id))) return false;
            }
            if (query._id.$eq !== undefined) {
                if (!matchesId(user._id, query._id.$eq)) return false;
            }
        } else {
            if (!matchesId(user._id, query._id)) return false;
        }
    }

    // fullName checks
    if (query.fullName !== undefined) {
        if (query.fullName instanceof RegExp) {
            if (!query.fullName.test(user.fullName || '')) return false;
        } else if (typeof query.fullName === 'object' && query.fullName !== null) {
            if (query.fullName.$regex !== undefined) {
                let regex;
                if (query.fullName.$regex instanceof RegExp) {
                    regex = query.fullName.$regex;
                } else {
                    const flags = query.fullName.$options || '';
                    regex = new RegExp(query.fullName.$regex, flags);
                }
                if (!regex.test(user.fullName || '')) return false;
            } else if (query.fullName.$eq !== undefined) {
                if (user.fullName !== query.fullName.$eq) return false;
            } else if (query.fullName.$ne !== undefined) {
                if (user.fullName === query.fullName.$ne) return false;
            }
        } else {
            if (user.fullName !== query.fullName) return false;
        }
    }

    // email checks
    if (query.email !== undefined && user.email !== query.email) {
        return false;
    }

    // googleId checks
    if (query.googleId !== undefined && user.googleId !== query.googleId) {
        return false;
    }

    // facebookId checks
    if (query.facebookId !== undefined && user.facebookId !== query.facebookId) {
        return false;
    }

    return true;
}

export function setupMockDb() {
    // Setup User model mocks
    User.findById = function (id) {
        return new MockQuery(() => {
            if (!id) return null;
            const doc = usersStore.get(id.toString());
            return doc ? clone(doc) : null;
        });
    };

    User.findOne = function (query = {}) {
        return new MockQuery(() => {
            for (const doc of usersStore.values()) {
                if (matchesUserFilter(doc, query)) return clone(doc);
            }
            return null;
        });
    };

    User.find = function (query = {}) {
        return new MockQuery(() => {
            const results = Array.from(usersStore.values()).filter(u => matchesUserFilter(u, query));
            return results.map(clone);
        });
    };

    User.create = async function (data) {
        const _id = data._id || new mongoose.Types.ObjectId().toString();
        const doc = {
            _id: _id.toString(),
            fullName: data.fullName || 'Test User',
            email: data.email || `user_${_id}@test.com`,
            password: data.password !== undefined ? data.password : null,
            picture: data.picture || 'https://example.com/pic.jpg',
            conversations: data.conversations || [],
            createdAt: data.createdAt || new Date(),
            googleId: data.googleId || null,
            facebookId: data.facebookId || null
        };
        usersStore.set(doc._id.toString(), doc);
        return clone(doc);
    };

    User.countDocuments = function (query = {}) {
        return new MockQuery(() => {
            return Array.from(usersStore.values()).filter(u => matchesUserFilter(u, query)).length;
        });
    };

    User.updateMany = async function (filter = {}, update = {}) {
        const targetIds = filter._id?.$in ? filter._id.$in.map(id => id.toString()) : Array.from(usersStore.keys());
        for (const id of targetIds) {
            const user = usersStore.get(id);
            if (user) {
                if (update.$addToSet && update.$addToSet.conversations) {
                    user.conversations = user.conversations || [];
                    const newEntry = update.$addToSet.conversations;
                    const exists = user.conversations.some(c => matchesId(c.conversation, newEntry.conversation));
                    if (!exists) {
                        user.conversations.push(clone(newEntry));
                    }
                }
            }
        }
        return { acknowledged: true, modifiedCount: targetIds.length };
    };

    User.findByIdAndUpdate = async function (id, update = {}, options = {}) {
        if (!id) return null;
        const user = usersStore.get(id.toString());
        if (!user) return null;

        if (update.$pull && update.$pull.conversations) {
            const convIdToRemove = update.$pull.conversations.conversation;
            user.conversations = (user.conversations || []).filter(
                c => !matchesId(c.conversation, convIdToRemove)
            );
        }
        if (update.$set) {
            Object.assign(user, update.$set);
        }
        return clone(user);
    };

    // Setup Conversation model mocks
    Conversation.findById = function (id) {
        return new MockQuery(() => {
            if (!id) return null;
            const doc = conversationsStore.get(id.toString());
            return doc ? clone(doc) : null;
        });
    };

    Conversation.findOne = function (query = {}) {
        return new MockQuery(() => {
            for (const doc of conversationsStore.values()) {
                let match = true;
                if (query.type && doc.type !== query.type) match = false;
                if (query.participants && query.participants.$all) {
                    const allPresent = query.participants.$all.every(p =>
                        (doc.participants || []).some(dp => matchesId(dp, p))
                    );
                    if (!allPresent) match = false;
                    if (query.participants.$size && doc.participants.length !== query.participants.$size) {
                        match = false;
                    }
                }
                if (match) return clone(doc);
            }
            return null;
        });
    };

    Conversation.prototype.save = async function () {
        const _id = this._id || new mongoose.Types.ObjectId().toString();
        const doc = {
            _id: _id.toString(),
            type: this.type || 'personal',
            name: this.name || '',
            participants: (this.participants || []).map(p => p.toString()),
            messages: (this.messages || []).map(m => m.toString()),
            lastMessage: this.lastMessage ? this.lastMessage.toString() : null,
            createdAt: this.createdAt || new Date(),
            updatedAt: new Date(),
        };
        conversationsStore.set(doc._id.toString(), doc);
        return clone(doc);
    };

    Conversation.findByIdAndUpdate = async function (id, update = {}, options = {}) {
        if (!id) return null;
        const conv = conversationsStore.get(id.toString());
        if (!conv) return null;

        if (update.$push && update.$push.messages) {
            conv.messages = conv.messages || [];
            conv.messages.push(update.$push.messages.toString());
        }
        if (update.$set) {
            if (update.$set.lastMessage) {
                conv.lastMessage = update.$set.lastMessage.toString();
            }
            Object.assign(conv, update.$set);
        }
        return clone(conv);
    };

    // Setup Message model mocks
    Message.findById = function (id) {
        return new MockQuery(() => {
            if (!id) return null;
            const doc = messagesStore.get(id.toString());
            if (!doc) return null;
            const res = clone(doc);
            if (res.senderId) {
                res.senderId = new mongoose.Types.ObjectId(res.senderId.toString());
            }
            res.save = async function () {
                const updated = {
                    ...clone(doc),
                    content: this.content,
                    isDeleted: Boolean(this.isDeleted),
                    deletedAt: this.deletedAt || null,
                    isEdited: Boolean(this.isEdited),
                    editedAt: this.editedAt || null,
                    type: this.type || 'text',
                    seenBy: (this.seenBy || []).map(s => s.toString())
                };
                messagesStore.set(this._id.toString(), updated);
                return this;
            };
            return res;
        });
    };

    Message.find = function (query = {}) {
        return new MockQuery(() => {
            let results = Array.from(messagesStore.values());
            if (query._id && query._id.$in) {
                const inIds = query._id.$in.map(id => id.toString());
                results = results.filter(m => inIds.includes(m._id.toString()));
            }
            if (query.createdAt && query.createdAt.$lt) {
                const ltDate = new Date(query.createdAt.$lt);
                results = results.filter(m => new Date(m.createdAt) < ltDate);
            }
            results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return results.map(clone);
        });
    };

    Message.create = async function (data) {
        const _id = data._id || new mongoose.Types.ObjectId().toString();
        const doc = {
            _id: _id.toString(),
            senderId: data.senderId.toString(),
            content: data.content,
            type: data.type || 'text',
            seenBy: (data.seenBy || []).map(s => s.toString()),
            createdAt: data.createdAt || new Date(),
        };
        messagesStore.set(doc._id.toString(), doc);
        const res = clone(doc);
        res.senderId = new mongoose.Types.ObjectId(doc.senderId);
        return res;
    };

    Message.updateMany = async function (filter = {}, update = {}) {
        let count = 0;
        const messageIds = filter._id?.$in ? filter._id.$in.map(m => m.toString()) : Array.from(messagesStore.keys());
        for (const mId of messageIds) {
            const msg = messagesStore.get(mId.toString());
            if (msg) {
                if (update.$addToSet && update.$addToSet.seenBy) {
                    const viewerId = update.$addToSet.seenBy.toString();
                    if (!msg.seenBy.includes(viewerId)) {
                        msg.seenBy.push(viewerId);
                        count++;
                    }
                }
            }
        }
        return { acknowledged: true, modifiedCount: count };
    };

    Message.findByIdAndUpdate = async function (id, update = {}, options = {}) {
        if (!id) return null;
        const msg = messagesStore.get(id.toString());
        if (!msg) return null;

        if (update.$addToSet && update.$addToSet.seenBy) {
            const viewerId = update.$addToSet.seenBy.toString();
            if (!msg.seenBy.includes(viewerId)) {
                msg.seenBy.push(viewerId);
            }
        }
        return clone(msg);
    };
}

export function restoreMockDb() {
    User.findById = origUserFindById;
    User.findOne = origUserFindOne;
    User.find = origUserFind;
    User.create = origUserCreate;
    User.updateMany = origUserUpdateMany;
    User.findByIdAndUpdate = origUserFindByIdAndUpdate;
    User.countDocuments = origUserCountDocuments;

    Conversation.findById = origConvFindById;
    Conversation.findOne = origConvFindOne;
    Conversation.find = origConvFind;
    Conversation.create = origConvCreate;
    Conversation.findByIdAndUpdate = origConvFindByIdAndUpdate;
    Conversation.prototype.save = origConvSave;

    Message.findById = origMsgFindById;
    Message.find = origMsgFind;
    Message.create = origMsgCreate;
    Message.updateMany = origMsgUpdateMany;
    Message.findByIdAndUpdate = origMsgFindByIdAndUpdate;
}

export function resetMockDb() {
    usersStore.clear();
    conversationsStore.clear();
    messagesStore.clear();
}

export function seedUser(userData) {
    const _id = userData._id ? userData._id.toString() : new mongoose.Types.ObjectId().toString();
    const doc = {
        _id,
        fullName: userData.fullName || 'Seeded User',
        email: userData.email || `user_${_id}@example.com`,
        picture: userData.picture || 'https://example.com/avatar.png',
        conversations: userData.conversations || [],
        createdAt: userData.createdAt || new Date(),
        googleId: userData.googleId || null,
        facebookId: userData.facebookId || null
    };
    usersStore.set(_id, doc);
    return doc;
}

export function seedConversation(convData) {
    const _id = convData._id ? convData._id.toString() : new mongoose.Types.ObjectId().toString();
    const doc = {
        _id,
        type: convData.type || 'personal',
        name: convData.name || '',
        participants: (convData.participants || []).map(p => (p._id ? p._id.toString() : p.toString())),
        messages: (convData.messages || []).map(m => (m._id ? m._id.toString() : m.toString())),
        lastMessage: convData.lastMessage ? (convData.lastMessage._id ? convData.lastMessage._id.toString() : convData.lastMessage.toString()) : null,
        createdAt: convData.createdAt || new Date(),
        updatedAt: new Date()
    };
    conversationsStore.set(_id, doc);
    return doc;
}

export function seedMessage(msgData) {
    const _id = msgData._id ? msgData._id.toString() : new mongoose.Types.ObjectId().toString();
    const doc = {
        _id,
        senderId: msgData.senderId ? (msgData.senderId._id ? msgData.senderId._id.toString() : msgData.senderId.toString()) : new mongoose.Types.ObjectId().toString(),
        content: msgData.content || 'Test message content',
        type: msgData.type || 'text',
        seenBy: (msgData.seenBy || []).map(s => (s._id ? s._id.toString() : s.toString())),
        isDeleted: Boolean(msgData.isDeleted),
        deletedAt: msgData.deletedAt || null,
        isEdited: Boolean(msgData.isEdited),
        editedAt: msgData.editedAt || null,
        createdAt: msgData.createdAt || new Date(),
    };
    messagesStore.set(_id, doc);

    if (msgData.conversationId) {
        const conv = conversationsStore.get(msgData.conversationId.toString());
        if (conv) {
            conv.messages = conv.messages || [];
            conv.messages.push(_id);
            conv.lastMessage = _id;
        }
    }

    return doc;
}

export function getMockUser(id) {
    return usersStore.get(id?.toString()) || null;
}

export function getMockConversation(id) {
    return conversationsStore.get(id?.toString()) || null;
}

export function getMockMessage(id) {
    return messagesStore.get(id?.toString()) || null;
}
