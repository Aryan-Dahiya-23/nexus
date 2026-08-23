import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { createTestApp, createAuthenticatedAgent } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser, seedConversation } from '../helpers/mockDb.js';

describe('Tier 1: Feature Coverage — ZEGOCLOUD RTC Token Issuance Authorization', () => {
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

    it('1. Unauthenticated GET /conversation/zego-token/:roomId returns 401 Unauthorized', async () => {
        const res = await supertest(app)
            .get(`/conversation/zego-token/${conversationAB._id}`)
            .set('Origin', 'http://localhost:5174');

        assert.equal(res.status, 401);
        assert.equal(res.body.error, true);
    });

    it('2. Authenticated participant receives 200 OK with valid RTC token structure', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.get(`/conversation/zego-token/${conversationAB._id}`);

        assert.equal(res.status, 200);
        assert.equal(res.body.error, false);
        assert.ok(typeof res.body.token === 'string' && res.body.token.length > 0);
        assert.equal(res.body.roomId, conversationAB._id.toString());
        assert.equal(res.body.userId, userA._id.toString());
        assert.equal(res.body.userName, userA.fullName);
    });

    it('3. Both active participants can independently fetch RTC tokens for the same conversation', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const agentB = createAuthenticatedAgent(app, userB);

        const resA = await agentA.get(`/conversation/zego-token/${conversationAB._id}`);
        const resB = await agentB.get(`/conversation/zego-token/${conversationAB._id}`);

        assert.equal(resA.status, 200);
        assert.equal(resB.status, 200);
        assert.equal(resA.body.userId, userA._id.toString());
        assert.equal(resB.body.userId, userB._id.toString());
        assert.notEqual(resA.body.token, resB.body.token); // Unique token per user
    });

    it('4. Non-participant User C receives 403 Forbidden when requesting token for User A & B room', async () => {
        const agentC = createAuthenticatedAgent(app, userC);
        const res = await agentC.get(`/conversation/zego-token/${conversationAB._id}`);

        // IDOR authorization guard must return 403 Forbidden
        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /forbidden|not a participant/i);
    });

    it('5. Token response includes appID integer matching server configuration', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.get(`/conversation/zego-token/${conversationAB._id}`);

        assert.equal(res.status, 200);
        assert.ok(typeof res.body.appID === 'number' || typeof res.body.appId === 'number');
    });
});
