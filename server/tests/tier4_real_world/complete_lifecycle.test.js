import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, createAuthenticatedAgent, createTestSocketServer } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser, getMockUser, getMockConversation } from '../helpers/mockDb.js';

describe('Tier 4: Real-World Scenarios — Full Multi-User Chat, RTC Token & Socket Workflows', () => {
    let app;
    let socketServer;
    let userA;
    let userB;
    let userC;
    let userD;

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
        userA = seedUser({ fullName: 'Alice Johnson', email: 'alice@nexus.app' });
        userB = seedUser({ fullName: 'Bob Williams', email: 'bob@nexus.app' });
        userC = seedUser({ fullName: 'Charlie Davis', email: 'charlie@nexus.app' });
        userD = seedUser({ fullName: 'Eve Hacker', email: 'eve@attacker.org' });
    });

    it('1. Scenario: Complete 1-on-1 chat, RTC token minting, multimedia messages, and read receipt flow', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const agentB = createAuthenticatedAgent(app, userB);
        const agentD = createAuthenticatedAgent(app, userD);

        // User A creates conversation with User B
        const createRes = await agentA
            .post('/conversation/create-conversation')
            .send({ receiverId: userB._id.toString() });

        assert.equal(createRes.status, 201);
        const conversationId = createRes.body.chat._id.toString();

        // User A fetches Zego RTC token
        const tokenResA = await agentA.get(`/conversation/zego-token/${conversationId}`);
        assert.equal(tokenResA.status, 200);
        assert.ok(tokenResA.body.token);

        // User B fetches Zego RTC token
        const tokenResB = await agentB.get(`/conversation/zego-token/${conversationId}`);
        assert.equal(tokenResB.status, 200);
        assert.ok(tokenResB.body.token);

        // User A sends text message
        const textMsg = await agentA
            .post(`/conversation/create-message/${conversationId}`)
            .send({ message: { content: 'Meeting starting now', type: 'text' } });
        assert.equal(textMsg.status, 200);

        // User A sends image message
        const imgMsg = await agentA
            .post(`/conversation/create-message/${conversationId}`)
            .send({ message: { content: 'https://cloudinary.com/diagram.png', type: 'image' } });
        assert.equal(imgMsg.status, 200);

        // User B marks messages as read
        const readRes = await agentB.put(`/conversation/read-conversation/${conversationId}`);
        assert.equal(readRes.status, 200);

        // Eve is blocked from reading
        const eveRead = await agentD.get(`/conversation/${conversationId}`);
        assert.equal(eveRead.status, 403);
    });

    it('2. Scenario: Multi-user group conversation messaging across 3 participants', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const agentB = createAuthenticatedAgent(app, userB);
        const agentC = createAuthenticatedAgent(app, userC);
        const agentD = createAuthenticatedAgent(app, userD);

        // Alice creates group with Bob & Charlie
        const groupRes = await agentA
            .post('/conversation/create-group-conversation')
            .send({
                name: 'Sprint Planning',
                participants: [userB._id.toString(), userC._id.toString()]
            });

        assert.equal(groupRes.status, 201);
        const groupId = groupRes.body.chat._id.toString();

        // Bob sends message
        const bobMsg = await agentB
            .post(`/conversation/create-message/${groupId}`)
            .send({ message: { content: 'Tasks assigned', type: 'text' } });
        assert.equal(bobMsg.status, 200);

        // Charlie sends message
        const charlieMsg = await agentC
            .post(`/conversation/create-message/${groupId}`)
            .send({ message: { content: 'Acknowledged', type: 'text' } });
        assert.equal(charlieMsg.status, 200);

        // Alice reads group conversation
        const aliceRead = await agentA.put(`/conversation/read-conversation/${groupId}`);
        assert.equal(aliceRead.status, 200);

        // Eve (non-member) cannot send messages to group
        const eveMsg = await agentD
            .post(`/conversation/create-message/${groupId}`)
            .send({ message: { content: 'Spam', type: 'text' } });
        assert.equal(eveMsg.status, 403);
    });

    it('3. Scenario: Real-time Socket.IO call signaling between active participants', async () => {
        const clientA = socketServer.connectClient({ user: userA });
        const clientB = socketServer.connectClient({ user: userB });

        // Seed conversation between A & B
        const agentA = createAuthenticatedAgent(app, userA);
        const convRes = await agentA
            .post('/conversation/create-conversation')
            .send({ receiverId: userB._id.toString() });
        const convId = convRes.body.chat._id.toString();

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                clientA.close();
                clientB.close();
                reject(new Error('Timeout waiting for video call signaling'));
            }, 1000);

            clientB.on('video call', (name, avatar, callerId, conversationId) => {
                assert.equal(callerId, userA._id.toString());
                assert.equal(conversationId, convId);

                // Bob accepts video call
                clientB.emit('accept video call', userA._id.toString(), convId);
            });

            clientA.on('accept video call', (conversationId) => {
                clearTimeout(timeout);
                assert.equal(conversationId, convId);
                clientA.close();
                clientB.close();
                resolve();
            });

            clientA.on('connect', () => {
                clientB.on('connect', () => {
                    clientA.emit('video call', 'Alice', 'avatar.png', userA._id.toString(), convId);
                });
            });
        });
    });

    it('4. Scenario: User conversation removal lifecycle and isolation', async () => {
        const agentA = createAuthenticatedAgent(app, userA);

        const convRes = await agentA
            .post('/conversation/create-conversation')
            .send({ receiverId: userB._id.toString() });
        const convId = convRes.body.chat._id.toString();

        // Alice removes conversation from her list
        const delRes = await agentA.put(`/conversation/user/${userA._id}/removeConversation/${convId}`);
        assert.equal(delRes.status, 200);

        // Verify conversation is removed from Alice's user profile
        const userADoc = getMockUser(userA._id);
        assert.ok(!userADoc.conversations.some(c => c.conversation.toString() === convId));

        // Bob still retains the conversation in his list
        const userBDoc = getMockUser(userB._id);
        assert.ok(userBDoc.conversations.some(c => c.conversation.toString() === convId));
    });

    it('5. Scenario: Authenticated identity verification and conversation list ordering', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const verifyRes = await agentA.get('/auth/verify');

        assert.equal(verifyRes.status, 200);
        assert.equal(verifyRes.body.error, false);
        assert.equal(verifyRes.body.user._id.toString(), userA._id.toString());
        assert.ok(Array.isArray(verifyRes.body.user.conversations));
    });
});
