import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, createAuthenticatedAgent } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser, seedConversation } from '../helpers/mockDb.js';

describe('Tier 2: Boundary & Corner Cases — ZEGOCLOUD Token Parameter Boundaries & IDOR Gating', () => {
    let app;
    let userA;
    let userB;
    let userC;
    let conversationAB;

    before(() => {
        setupMockDb();
        app = createTestApp();
    });

    after(() => {
        restoreMockDb();
    });

    beforeEach(() => {
        resetMockDb();
        userA = seedUser({ fullName: 'Alice Participant' });
        userB = seedUser({ fullName: 'Bob Participant' });
        userC = seedUser({ fullName: 'Charlie Outsider' });

        conversationAB = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });
    });

    it('1. Non-hex invalid ObjectId string as roomId returns 400 Bad Request or 403/404', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.get('/conversation/zego-token/invalid-room-id-1234');

        // Must not mint token for invalid room identifier
        assert.ok([400, 403, 404].includes(res.status));
        assert.equal(res.body.error, true);
    });

    it('2. Directory traversal sequence in roomId returns 400 Bad Request or 403/404', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.get('/conversation/zego-token/..%2F..%2Fetc%2Fpasswd');

        assert.ok([400, 403, 404].includes(res.status));
        assert.equal(res.body.error, true);
    });

    it('3. Non-existent valid ObjectId as roomId returns 404 Not Found or 403 Forbidden', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const nonExistentId = '64b1f8e4e9b9c1a234567899';
        const res = await agentA.get(`/conversation/zego-token/${nonExistentId}`);

        // Room does not exist -> token must NOT be issued
        assert.ok([403, 404].includes(res.status));
        assert.equal(res.body.error, true);
    });

    it('4. Authenticated User C attempting to get token for Conversation AB returns 403 Forbidden', async () => {
        const agentC = createAuthenticatedAgent(app, userC);
        const res = await agentC.get(`/conversation/zego-token/${conversationAB._id}`);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /forbidden|participant/i);
    });

    it('5. Participant user can fetch token repeatedly with updated timestamps', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res1 = await agentA.get(`/conversation/zego-token/${conversationAB._id}`);
        const res2 = await agentA.get(`/conversation/zego-token/${conversationAB._id}`);

        assert.equal(res1.status, 200);
        assert.equal(res2.status, 200);
        assert.equal(res1.body.roomId, conversationAB._id.toString());
        assert.equal(res2.body.roomId, conversationAB._id.toString());
    });
});
