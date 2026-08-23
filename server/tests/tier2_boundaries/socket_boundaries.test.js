import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestSocketServer } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser, seedConversation } from '../helpers/mockDb.js';

describe('Tier 2: Boundary & Corner Cases — Socket.IO Impersonation & Room Membership Boundaries', () => {
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
        userA = seedUser({ fullName: 'Alice Alice' });
        userB = seedUser({ fullName: 'Bob Bob' });
        userC = seedUser({ fullName: 'Charlie Eve' });

        conversationAB = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });
    });

    it('1. Authenticated User A can join conversation room where User A is a participant', async () => {
        const clientA = socketServer.connectClient({ user: userA });

        await new Promise((resolve) => {
            clientA.on('connect', () => {
                clientA.emit('join conversation', conversationAB._id.toString());
                setTimeout(() => {
                    clientA.close();
                    resolve();
                }, 50);
            });
        });
    });

    it('2. Unauthorized User C emitting "join conversation" for Conversation AB is not joined to the room', async () => {
        const clientC = socketServer.connectClient({ user: userC });

        await new Promise((resolve) => {
            clientC.on('connect', () => {
                // User C tries to join room of User A & B
                clientC.emit('join conversation', conversationAB._id.toString());
                setTimeout(() => {
                    clientC.close();
                    resolve();
                }, 50);
            });
        });
    });

    it('3. User A sending "chat message" transmits message to conversation participants', async () => {
        const clientA = socketServer.connectClient({ user: userA });
        const clientB = socketServer.connectClient({ user: userB });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                clientA.close();
                clientB.close();
                reject(new Error('Timeout waiting for chat message event'));
            }, 1000);

            clientB.on('chat message', (senderId, newMessage, conversationId) => {
                clearTimeout(timeout);
                assert.equal(senderId, userA._id.toString());
                assert.equal(conversationId, conversationAB._id.toString());
                assert.equal(newMessage.content, 'Hello Bob!');
                clientA.close();
                clientB.close();
                resolve();
            });

            clientA.on('connect', () => {
                clientB.on('connect', () => {
                    clientA.emit('chat message', userA._id.toString(), { content: 'Hello Bob!' }, conversationAB._id.toString());
                });
            });
        });
    });

    it('4. User A emitting "video call" signals Bob without broadcasting to unrelated User C', async () => {
        const clientA = socketServer.connectClient({ user: userA });
        const clientB = socketServer.connectClient({ user: userB });
        const clientC = socketServer.connectClient({ user: userC });

        await new Promise((resolve, reject) => {
            let userCReceivedCall = false;

            clientC.on('video call', () => {
                userCReceivedCall = true;
            });

            clientB.on('video call', (name, avatar, callerId, conversationId) => {
                assert.equal(callerId, userA._id.toString());
                assert.equal(conversationId, conversationAB._id.toString());
                assert.equal(userCReceivedCall, false); // C must not receive call signal

                clientA.close();
                clientB.close();
                clientC.close();
                resolve();
            });

            clientA.on('connect', () => {
                clientB.on('connect', () => {
                    clientC.on('connect', () => {
                        clientA.emit('video call', 'Alice', 'avatar.png', userA._id.toString(), conversationAB._id.toString());
                    });
                });
            });
        });
    });

    it('5. User emitting "leave conversation" removes socket from room', async () => {
        const clientA = socketServer.connectClient({ user: userA });

        await new Promise((resolve) => {
            clientA.on('connect', () => {
                clientA.emit('join conversation', conversationAB._id.toString());
                clientA.emit('leave conversation', conversationAB._id.toString());
                setTimeout(() => {
                    clientA.close();
                    resolve();
                }, 50);
            });
        });
    });
});
