import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, createAuthenticatedAgent, createUnauthenticatedAgent, createTestSocketServer } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser, seedConversation, seedMessage, getMockMessage, getMockConversation, getMockUser } from '../helpers/mockDb.js';

describe('Tier 2 Challenger: Empirical Verification & Adversarial Stress Tests (Milestone 1)', () => {
    let app;
    let socketServer;
    let userA;
    let userB;
    let userC;
    let conversationAB;

    before(async () => {
        setupMockDb();
        app = createTestApp();
        socketServer = await createTestSocketServer();
    });

    after(async () => {
        restoreMockDb();
        if (socketServer) {
            await socketServer.cleanup();
        }
    });

    beforeEach(() => {
        resetMockDb();
        userA = seedUser({ fullName: 'Alice Challenger' });
        userB = seedUser({ fullName: 'Bob Challenger' });
        userC = seedUser({ fullName: 'Charlie Malory' });

        conversationAB = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });
    });

    describe('1. Socket.IO Handshake Auth Rejection', () => {
        it('1.1 Handshake rejects unauthenticated socket connection (no session cookie/header)', async () => {
            const client = socketServer.connectClient({}); // No user provided

            await new Promise((resolve, reject) => {
                client.on('connect', () => {
                    client.close();
                    reject(new Error('CRITICAL BUG: Unauthenticated socket connected without session!'));
                });

                client.on('connect_error', (err) => {
                    try {
                        assert.ok(err);
                        assert.match(err.message, /Authentication error: No active session/i);
                        client.close();
                        resolve();
                    } catch (e) {
                        client.close();
                        reject(e);
                    }
                });
            });
        });

        it('1.2 Handshake rejects connection attempting to pass spoofed client auth payload without session', async () => {
            const client = socketServer.connectClient({
                auth: { userId: userA._id.toString(), fakeSession: 'imposter' }
            });

            await new Promise((resolve, reject) => {
                client.on('connect', () => {
                    client.close();
                    reject(new Error('CRITICAL BUG: Spoofed auth connected without session!'));
                });

                client.on('connect_error', (err) => {
                    try {
                        assert.ok(err);
                        assert.match(err.message, /Authentication error: No active session/i);
                        client.close();
                        resolve();
                    } catch (e) {
                        client.close();
                        reject(e);
                    }
                });
            });
        });

        it('1.3 Authenticated socket connects successfully and joins only its own user room', async () => {
            const client = socketServer.connectClient({ user: userA });

            await new Promise((resolve, reject) => {
                client.on('connect', () => {
                    assert.equal(client.connected, true);
                    client.close();
                    resolve();
                });
                client.on('connect_error', (err) => {
                    client.close();
                    reject(err);
                });
            });
        });
    });

    describe('2. Socket.IO Room Authorization & Message Containment', () => {
        it('2.1 Participant socket joins conversation room; Non-participant socket is rejected', async () => {
            const clientA = socketServer.connectClient({ user: userA });
            const clientC = socketServer.connectClient({ user: userC });

            await new Promise((resolve, reject) => {
                let aConnected = false;
                let cConnected = false;

                const checkRooms = () => {
                    if (aConnected && cConnected) {
                        clientA.emit('join conversation', conversationAB._id.toString());
                        clientC.emit('join conversation', conversationAB._id.toString());

                        setTimeout(() => {
                            try {
                                const roomName = `conversation:${conversationAB._id.toString()}`;
                                const room = socketServer.io.sockets.adapter.rooms.get(roomName);

                                // User A must be in the room
                                assert.ok(room, 'Room must exist after participant joins');
                                assert.ok(room.has(clientA.id), 'Participant User A socket must be in room');

                                // User C must NOT be in the room
                                assert.ok(!room.has(clientC.id), 'Non-participant User C socket must NOT be in room');

                                clientA.close();
                                clientC.close();
                                resolve();
                            } catch (err) {
                                clientA.close();
                                clientC.close();
                                reject(err);
                            }
                        }, 50);
                    }
                };

                clientA.on('connect', () => { aConnected = true; checkRooms(); });
                clientC.on('connect', () => { cConnected = true; checkRooms(); });
            });
        });

        it('2.2 Non-participant User C cannot receive messages sent to Conversation AB', async () => {
            const clientA = socketServer.connectClient({ user: userA });
            const clientB = socketServer.connectClient({ user: userB });
            const clientC = socketServer.connectClient({ user: userC });

            await new Promise((resolve, reject) => {
                let userCReceived = false;
                let userBReceived = false;

                clientC.on('chat message', () => {
                    userCReceived = true;
                });

                clientB.on('chat message', (senderId, msg, convId) => {
                    userBReceived = true;
                    assert.equal(senderId, userA._id.toString());
                    assert.equal(convId, conversationAB._id.toString());
                    assert.equal(msg.content, 'Private chat between A and B');
                });

                let readyCount = 0;
                const onReady = () => {
                    readyCount++;
                    if (readyCount === 3) {
                        // User C tries to join room first (should fail silently)
                        clientC.emit('join conversation', conversationAB._id.toString());
                        clientA.emit('join conversation', conversationAB._id.toString());
                        clientB.emit('join conversation', conversationAB._id.toString());

                        setTimeout(() => {
                            clientA.emit('chat message', userA._id.toString(), { content: 'Private chat between A and B' }, conversationAB._id.toString());

                            setTimeout(() => {
                                try {
                                    assert.equal(userBReceived, true, 'Participant Bob must receive message');
                                    assert.equal(userCReceived, false, 'Non-participant Charlie must NOT receive message');
                                    clientA.close();
                                    clientB.close();
                                    clientC.close();
                                    resolve();
                                } catch (err) {
                                    clientA.close();
                                    clientB.close();
                                    clientC.close();
                                    reject(err);
                                }
                            }, 50);
                        }, 50);
                    }
                };

                clientA.on('connect', onReady);
                clientB.on('connect', onReady);
                clientC.on('connect', onReady);
            });
        });

        it('2.3 Non-participant User C cannot broadcast chat messages or call signals to Conversation AB', async () => {
            const clientA = socketServer.connectClient({ user: userA });
            const clientB = socketServer.connectClient({ user: userB });
            const clientC = socketServer.connectClient({ user: userC });

            await new Promise((resolve, reject) => {
                let userAReceived = false;
                let userBReceived = false;

                clientA.on('chat message', () => { userAReceived = true; });
                clientB.on('chat message', () => { userBReceived = true; });
                clientA.on('video call', () => { userAReceived = true; });
                clientB.on('video call', () => { userBReceived = true; });

                let readyCount = 0;
                const onReady = () => {
                    readyCount++;
                    if (readyCount === 3) {
                        // User C attempts unauthorized broadcasts
                        clientC.emit('chat message', userC._id.toString(), { content: 'Intruder message' }, conversationAB._id.toString());
                        clientC.emit('video call', 'Charlie', 'avatar.png', userC._id.toString(), conversationAB._id.toString());

                        setTimeout(() => {
                            try {
                                assert.equal(userAReceived, false, 'User A must not receive unauthorized message/call from outsider');
                                assert.equal(userBReceived, false, 'User B must not receive unauthorized message/call from outsider');
                                clientA.close();
                                clientB.close();
                                clientC.close();
                                resolve();
                            } catch (err) {
                                clientA.close();
                                clientB.close();
                                clientC.close();
                                reject(err);
                            }
                        }, 50);
                    }
                };

                clientA.on('connect', onReady);
                clientB.on('connect', onReady);
                clientC.on('connect', onReady);
            });
        });
    });

    describe('3. Group Conversation Creation Participant Validation', () => {
        it('3.1 Reject group creation when participant ID does not exist in DB (400 Bad Request)', async () => {
            const agentA = createAuthenticatedAgent(app, userA);
            const nonExistentId = '64b1f8e4e9b9c1a234567899';

            const res = await agentA
                .post('/conversation/create-group-conversation')
                .send({
                    name: 'Project Orion',
                    participants: [userB._id.toString(), nonExistentId]
                });

            assert.equal(res.status, 400);
            assert.equal(res.body.error, true);
            assert.match(res.body.message, /participants do not exist/i);
        });

        it('3.2 Reject group creation when participant ID is an invalid format string', async () => {
            const agentA = createAuthenticatedAgent(app, userA);

            const res = await agentA
                .post('/conversation/create-group-conversation')
                .send({
                    name: 'Invalid Hex Group',
                    participants: [userB._id.toString(), 'invalid-hex-id-123']
                });

            assert.equal(res.status, 400);
            assert.equal(res.body.error, true);
            assert.match(res.body.message, /Invalid participant ID/i);
        });

        it('3.3 Reject group creation when name is empty or whitespace', async () => {
            const agentA = createAuthenticatedAgent(app, userA);

            const res = await agentA
                .post('/conversation/create-group-conversation')
                .send({
                    name: '    ',
                    participants: [userB._id.toString()]
                });

            assert.equal(res.status, 400);
            assert.equal(res.body.error, true);
            assert.match(res.body.message, /Group name is required/i);
        });

        it('3.4 Reject group creation when participants array is empty or missing', async () => {
            const agentA = createAuthenticatedAgent(app, userA);

            const res = await agentA
                .post('/conversation/create-group-conversation')
                .send({
                    name: 'Empty Participants Group',
                    participants: []
                });

            assert.equal(res.status, 400);
            assert.equal(res.body.error, true);
        });

        it('3.5 Successfully create group with valid existing users and link to all participants', async () => {
            const agentA = createAuthenticatedAgent(app, userA);

            const res = await agentA
                .post('/conversation/create-group-conversation')
                .send({
                    name: 'Engineering Team',
                    participants: [userB._id.toString(), userC._id.toString()]
                });

            assert.equal(res.status, 201);
            assert.equal(res.body.error, false);
            assert.equal(res.body.chat.type, 'group');
            assert.equal(res.body.chat.name, 'Engineering Team');
            assert.equal(res.body.chat.participants.length, 3);

            // Verify all 3 users have the conversation linked in DB
            const userADoc = getMockUser(userA._id);
            const userBDoc = getMockUser(userB._id);
            const userCDoc = getMockUser(userC._id);

            const groupConvId = res.body.chat._id.toString();
            assert.ok(userADoc.conversations.some(c => c.conversation.toString() === groupConvId));
            assert.ok(userBDoc.conversations.some(c => c.conversation.toString() === groupConvId));
            assert.ok(userCDoc.conversations.some(c => c.conversation.toString() === groupConvId));
        });
    });

    describe('4. Multi-Message Atomic Read Receipts', () => {
        it('4.1 Reading conversation marks all unread messages from other participants as seen', async () => {
            const agentA = createAuthenticatedAgent(app, userA);

            // Seed 4 messages in conversationAB:
            // Msg 1 by Bob (unseen by Alice)
            // Msg 2 by Bob (unseen by Alice)
            // Msg 3 by Alice (seen by Alice)
            // Msg 4 by Bob (unseen by Alice)
            const m1 = seedMessage({ senderId: userB._id, content: 'Msg 1', seenBy: [userB._id] });
            const m2 = seedMessage({ senderId: userB._id, content: 'Msg 2', seenBy: [userB._id] });
            const m3 = seedMessage({ senderId: userA._id, content: 'Msg 3', seenBy: [userA._id] });
            const m4 = seedMessage({ senderId: userB._id, content: 'Msg 4', seenBy: [userB._id] });

            conversationAB.messages = [m1._id, m2._id, m3._id, m4._id];
            conversationAB.lastMessage = m4._id;

            // Before read: Alice is not in seenBy for m1, m2, m4
            assert.equal(getMockMessage(m1._id).seenBy.includes(userA._id.toString()), false);
            assert.equal(getMockMessage(m2._id).seenBy.includes(userA._id.toString()), false);
            assert.equal(getMockMessage(m4._id).seenBy.includes(userA._id.toString()), false);

            const res = await agentA.put(`/conversation/read-conversation/${conversationAB._id}`);
            assert.equal(res.status, 200);
            assert.equal(res.body.error, false);

            // After read: Alice MUST be in seenBy for all messages
            assert.equal(getMockMessage(m1._id).seenBy.includes(userA._id.toString()), true);
            assert.equal(getMockMessage(m2._id).seenBy.includes(userA._id.toString()), true);
            assert.equal(getMockMessage(m3._id).seenBy.includes(userA._id.toString()), true);
            assert.equal(getMockMessage(m4._id).seenBy.includes(userA._id.toString()), true);
        });

        it('4.2 Non-participant User C cannot mark messages as read (403 Forbidden)', async () => {
            const agentC = createAuthenticatedAgent(app, userC);

            const m1 = seedMessage({ senderId: userB._id, content: 'Secret Msg', seenBy: [userB._id] });
            conversationAB.messages = [m1._id];

            const res = await agentC.put(`/conversation/read-conversation/${conversationAB._id}`);
            assert.equal(res.status, 403);
            assert.equal(res.body.error, true);

            // Verify User C was not added to seenBy
            assert.equal(getMockMessage(m1._id).seenBy.includes(userC._id.toString()), false);
        });

        it('4.3 Idempotency: Calling read-conversation multiple times does not create duplicate seenBy entries', async () => {
            const agentA = createAuthenticatedAgent(app, userA);

            const m1 = seedMessage({ senderId: userB._id, content: 'Idempotent test', seenBy: [userB._id] });
            conversationAB.messages = [m1._id];

            await agentA.put(`/conversation/read-conversation/${conversationAB._id}`);
            await agentA.put(`/conversation/read-conversation/${conversationAB._id}`);
            await agentA.put(`/conversation/read-conversation/${conversationAB._id}`);

            const seenByList = getMockMessage(m1._id).seenBy;
            const aliceOccurrences = seenByList.filter(id => id === userA._id.toString());
            assert.equal(aliceOccurrences.length, 1, 'Alice must appear exactly once in seenBy array');
        });
    });
});
