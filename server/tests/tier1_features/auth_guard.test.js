import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { createTestApp } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb } from '../helpers/mockDb.js';

describe('Tier 1: Feature Coverage — Unauthenticated REST Route Guards (401 Unauthorized)', () => {
    let app;
    let request;

    before(() => {
        setupMockDb();
        app = createTestApp();
        request = supertest(app);
    });

    after(() => {
        restoreMockDb();
    });

    beforeEach(() => {
        resetMockDb();
    });

    it('1. GET /conversation/:conversationId without session returns 401 Unauthorized', async () => {
        const res = await request
            .get('/conversation/64b1f8e4e9b9c1a234567890')
            .set('Origin', 'http://localhost:5174');

        assert.equal(res.status, 401);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /unauthorized|log in/i);
    });

    it('2. POST /conversation/create-conversation without session returns 401 Unauthorized', async () => {
        const res = await request
            .post('/conversation/create-conversation')
            .set('Origin', 'http://localhost:5174')
            .send({ receiverId: '64b1f8e4e9b9c1a234567891' });

        assert.equal(res.status, 401);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /unauthorized/i);
    });

    it('3. POST /conversation/create-group-conversation without session returns 401 Unauthorized', async () => {
        const res = await request
            .post('/conversation/create-group-conversation')
            .set('Origin', 'http://localhost:5174')
            .send({ name: 'Secret Group', participants: ['64b1f8e4e9b9c1a234567891', '64b1f8e4e9b9c1a234567892'] });

        assert.equal(res.status, 401);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /unauthorized/i);
    });

    it('4. POST /conversation/create-message/:conversationId without session returns 401 Unauthorized', async () => {
        const res = await request
            .post('/conversation/create-message/64b1f8e4e9b9c1a234567890')
            .set('Origin', 'http://localhost:5174')
            .send({ message: { content: 'Unauthenticated spam' } });

        assert.equal(res.status, 401);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /unauthorized/i);
    });

    it('5. PUT /conversation/read-conversation/:conversationId without session returns 401 Unauthorized', async () => {
        const res = await request
            .put('/conversation/read-conversation/64b1f8e4e9b9c1a234567890')
            .set('Origin', 'http://localhost:5174');

        assert.equal(res.status, 401);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /unauthorized/i);
    });

    it('6. PUT /conversation/user/:userId/removeConversation/:conversationId without session returns 401 Unauthorized', async () => {
        const res = await request
            .put('/conversation/user/64b1f8e4e9b9c1a234567891/removeConversation/64b1f8e4e9b9c1a234567890')
            .set('Origin', 'http://localhost:5174');

        assert.equal(res.status, 401);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /unauthorized/i);
    });

    it('7. GET /conversation/zego-token/:roomId without session returns 401 Unauthorized', async () => {
        const res = await request
            .get('/conversation/zego-token/64b1f8e4e9b9c1a234567890')
            .set('Origin', 'http://localhost:5174');

        assert.equal(res.status, 401);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /unauthorized/i);
    });

    it('8. GET /auth/people without session returns 401 Unauthorized', async () => {
        const res = await request
            .get('/auth/people')
            .set('Origin', 'http://localhost:5174');

        assert.equal(res.status, 401);
        assert.equal(res.body.error, true);
    });

    it('9. GET /auth/verify without session returns 401 Unauthorized with reason payload', async () => {
        const res = await request
            .get('/auth/verify')
            .set('Origin', 'http://localhost:5174');

        assert.equal(res.status, 401);
        assert.equal(res.body.error, true);
        assert.equal(res.body.message, 'Not Authorized');
        assert.match(res.body.reason, /not authenticated/i);
    });
});
