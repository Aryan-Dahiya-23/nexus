import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, createAuthenticatedAgent } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser, seedConversation, seedMessage } from '../helpers/mockDb.js';

describe('Tier 3: Cross-Feature Combinations — IDOR Defense & Authorization Boundaries', () => {
    let app;
    let userA;
    let userB;
    let userC;
    let conversationBC;
    let messageInBC;

    before(() => {
        setupMockDb();
        app = createTestApp();
    });

    after(() => {
        restoreMockDb();
    });

    beforeEach(() => {
        resetMockDb();
        userA = seedUser({ fullName: 'Attacker User A' });
        userB = seedUser({ fullName: 'Victim User B' });
        userC = seedUser({ fullName: 'Victim User C' });

        conversationBC = seedConversation({
            type: 'personal',
            participants: [userB._id, userC._id],
            messages: []
        });

        messageInBC = seedMessage({
            senderId: userB._id,
            content: 'Secret conversation between B and C',
            seenBy: [userB._id]
        });

        conversationBC.messages = [messageInBC._id];
        conversationBC.lastMessage = messageInBC._id;
    });

    it('1. IDOR Read: User A cannot read conversation between User B & User C (403 Forbidden)', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.get(`/conversation/${conversationBC._id}`);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /forbidden|participant/i);
    });

    it('2. IDOR Write: User A cannot send messages into conversation between User B & User C (403 Forbidden)', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .post(`/conversation/create-message/${conversationBC._id}`)
            .send({
                message: {
                    content: 'Injected spoofed message from User A',
                    type: 'text'
                }
            });

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /forbidden|cannot send/i);
    });

    it('3. IDOR Read Receipt: User A cannot mark messages as read in conversation between User B & User C (403 Forbidden)', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.put(`/conversation/read-conversation/${conversationBC._id}`);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
    });

    it('4. IDOR Remove Conversation: User A cannot delete/remove conversation for User B (403 Forbidden)', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.put(`/conversation/user/${userB._id}/removeConversation/${conversationBC._id}`);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /forbidden|cannot remove/i);
    });

    it('5. IDOR Video Token: User A cannot obtain ZEGOCLOUD RTC token for conversation between User B & User C (403 Forbidden)', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.get(`/conversation/zego-token/${conversationBC._id}`);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /forbidden|participant/i);
    });

    it('6. Deduplication: Creating conversation when one already exists returns 200 OK with existing chat', async () => {
        const agentB = createAuthenticatedAgent(app, userB);
        const res = await agentB
            .post('/conversation/create-conversation')
            .send({ receiverId: userC._id.toString() });

        assert.equal(res.status, 200);
        assert.equal(res.body.error, false);
        assert.match(res.body.message, /already exists/i);
        assert.equal(res.body.chat._id.toString(), conversationBC._id.toString());
    });

    it('7. IDOR Paginated Messages: User A cannot read paginated messages in conversation between User B & User C (403 Forbidden)', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.get(`/conversation/${conversationBC._id}/messages`);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /forbidden|participant/i);
    });

    it('8. Legitimate Participant can fetch paginated messages (200 OK)', async () => {
        const agentB = createAuthenticatedAgent(app, userB);
        const res = await agentB.get(`/conversation/${conversationBC._id}/messages`);

        assert.equal(res.status, 200);
        assert.equal(res.body.error, false);
        assert.equal(Array.isArray(res.body.messages), true);
        assert.equal(res.body.messages.length, 1);
        assert.equal(res.body.messages[0].content, 'Secret conversation between B and C');
    });
});
