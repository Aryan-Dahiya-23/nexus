import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestSocketServer } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser, seedConversation } from '../helpers/mockDb.js';

describe('Tier 1: Feature Coverage — Typing Indicator & Real-Time Typing Bubble Events', () => {
    let socketServer;
    let userA;
    let userB;
    let userC;
    let conversationAB;

    before(async () => {
        setupMockDb();
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
        userA = seedUser({ fullName: 'Alice Alice', picture: 'https://res.cloudinary.com/test/alice.png' });
        userB = seedUser({ fullName: 'Bob Bob', picture: 'https://res.cloudinary.com/test/bob.png' });
        userC = seedUser({ fullName: 'Charlie Eve' });

        conversationAB = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });
    });

    it('1. User A emitting "typing" transmits typing payload to User B in active conversation and user room', async () => {
        const clientA = socketServer.connectClient({ user: userA });
        const clientB = socketServer.connectClient({ user: userB });

        await new Promise((resolve, reject) => {
            let receivedRoomTyping = false;
            let receivedUserTyping = false;

            const timeout = setTimeout(() => {
                clientA.close();
                clientB.close();
                reject(new Error('Timeout waiting for typing events'));
            }, 1000);

            const checkDone = () => {
                if (receivedRoomTyping && receivedUserTyping) {
                    clearTimeout(timeout);
                    clientA.close();
                    clientB.close();
                    resolve();
                }
            };

            clientB.on('typing', (convId, typingUser) => {
                assert.equal(convId, conversationAB._id.toString());
                assert.equal(typingUser.userId, userA._id.toString());
                assert.equal(typingUser.userName, 'Alice Alice');
                receivedRoomTyping = true;
                checkDone();
            });

            clientB.on('user typing', (convId, typingUser) => {
                assert.equal(convId, conversationAB._id.toString());
                assert.equal(typingUser.userId, userA._id.toString());
                receivedUserTyping = true;
                checkDone();
            });

            clientA.on('connect', () => {
                clientB.on('connect', () => {
                    clientB.emit('join conversation', conversationAB._id.toString());
                    setTimeout(() => {
                        clientA.emit('typing', conversationAB._id.toString(), {
                            userName: userA.fullName,
                            userPicture: userA.picture
                        });
                    }, 50);
                });
            });
        });
    });

    it('2. Unauthorized User C emitting "typing" for Conversation AB is ignored', async () => {
        const clientC = socketServer.connectClient({ user: userC });
        const clientB = socketServer.connectClient({ user: userB });

        await new Promise((resolve, reject) => {
            let receivedTyping = false;

            clientB.on('typing', () => {
                receivedTyping = true;
                clientC.close();
                clientB.close();
                reject(new Error('Unauthorized typing event should not be broadcast'));
            });

            clientB.on('user typing', () => {
                receivedTyping = true;
                clientC.close();
                clientB.close();
                reject(new Error('Unauthorized user typing event should not be broadcast'));
            });

            clientC.on('connect', () => {
                clientB.on('connect', () => {
                    clientB.emit('join conversation', conversationAB._id.toString());
                    setTimeout(() => {
                        clientC.emit('typing', conversationAB._id.toString(), {
                            userName: userC.fullName
                        });
                        setTimeout(() => {
                            clientC.close();
                            clientB.close();
                            if (!receivedTyping) resolve();
                        }, 100);
                    }, 50);
                });
            });
        });
    });

    it('3. User A emitting "stop typing" transmits stop typing signal to User B', async () => {
        const clientA = socketServer.connectClient({ user: userA });
        const clientB = socketServer.connectClient({ user: userB });

        await new Promise((resolve, reject) => {
            let receivedRoomStop = false;
            let receivedUserStop = false;

            const timeout = setTimeout(() => {
                clientA.close();
                clientB.close();
                reject(new Error('Timeout waiting for stop typing events'));
            }, 1000);

            const checkDone = () => {
                if (receivedRoomStop && receivedUserStop) {
                    clearTimeout(timeout);
                    clientA.close();
                    clientB.close();
                    resolve();
                }
            };

            clientB.on('stop typing', (convId, actorId) => {
                assert.equal(convId, conversationAB._id.toString());
                assert.equal(actorId, userA._id.toString());
                receivedRoomStop = true;
                checkDone();
            });

            clientB.on('user stop typing', (convId, actorId) => {
                assert.equal(convId, conversationAB._id.toString());
                assert.equal(actorId, userA._id.toString());
                receivedUserStop = true;
                checkDone();
            });

            clientA.on('connect', () => {
                clientB.on('connect', () => {
                    clientB.emit('join conversation', conversationAB._id.toString());
                    setTimeout(() => {
                        clientA.emit('stop typing', conversationAB._id.toString());
                    }, 50);
                });
            });
        });
    });

    it('4. User A leaving conversation emits "stop typing" to conversation room', async () => {
        const clientA = socketServer.connectClient({ user: userA });
        const clientB = socketServer.connectClient({ user: userB });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                clientA.close();
                clientB.close();
                reject(new Error('Timeout waiting for leave conversation stop typing'));
            }, 1000);

            clientB.on('stop typing', (convId, actorId) => {
                clearTimeout(timeout);
                assert.equal(convId, conversationAB._id.toString());
                assert.equal(actorId, userA._id.toString());
                clientA.close();
                clientB.close();
                resolve();
            });

            clientA.on('connect', () => {
                clientB.on('connect', () => {
                    clientA.emit('join conversation', conversationAB._id.toString());
                    clientB.emit('join conversation', conversationAB._id.toString());
                    setTimeout(() => {
                        clientA.emit('leave conversation', conversationAB._id.toString());
                    }, 50);
                });
            });
        });
    });
});
