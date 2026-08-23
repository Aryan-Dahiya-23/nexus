import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { createTestApp, createAuthenticatedAgent } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser } from '../helpers/mockDb.js';

describe('Tier 1: Feature Coverage — Exact Origin & CSRF Defense', () => {
    let app;
    let request;
    let userA;

    before(() => {
        setupMockDb();
        app = createTestApp();
        request = supertest(app);
        userA = seedUser({ fullName: 'Origin Tester' });
    });

    after(() => {
        restoreMockDb();
    });

    beforeEach(() => {
        resetMockDb();
        userA = seedUser({ fullName: 'Origin Tester' });
    });

    it('1. POST request with valid Origin http://localhost:5174 is allowed past CSRF middleware', async () => {
        const res = await request
            .post('/conversation/create-conversation')
            .set('Origin', 'http://localhost:5174')
            .send({ receiverId: '64b1f8e4e9b9c1a234567899' });

        // Allowed past CSRF -> reaches auth guard -> 401 Unauthorized
        assert.equal(res.status, 401);
    });

    it('2. POST request with valid Origin https://nexus-aryan.vercel.app is allowed past CSRF middleware', async () => {
        const res = await request
            .post('/conversation/create-conversation')
            .set('Origin', 'https://nexus-aryan.vercel.app')
            .send({ receiverId: '64b1f8e4e9b9c1a234567899' });

        // Allowed past CSRF -> reaches auth guard -> 401 Unauthorized
        assert.equal(res.status, 401);
    });

    it('3. PUT request with valid Referer http://localhost:5174/chats is allowed past CSRF middleware', async () => {
        const res = await request
            .put('/conversation/read-conversation/64b1f8e4e9b9c1a234567890')
            .set('Referer', 'http://localhost:5174/chats');

        assert.equal(res.status, 401);
    });

    it('4. POST request with invalid Origin https://attacker.com returns 403 Forbidden', async () => {
        const res = await request
            .post('/conversation/create-conversation')
            .set('Origin', 'https://attacker.com')
            .send({ receiverId: '64b1f8e4e9b9c1a234567899' });

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /forbidden|invalid.*origin/i);
    });

    it('5. POST request with missing Origin and Referer returns 403 Forbidden', async () => {
        const res = await request
            .post('/conversation/create-conversation')
            .send({ receiverId: '64b1f8e4e9b9c1a234567899' });

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /forbidden|invalid.*origin|missing/i);
    });

    it('6. PUT request with invalid Origin returns 403 Forbidden', async () => {
        const res = await request
            .put('/conversation/read-conversation/64b1f8e4e9b9c1a234567890')
            .set('Origin', 'https://evil-site.com');

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
    });

    it('7. DELETE request with invalid Origin returns 403 Forbidden', async () => {
        const res = await request
            .delete('/conversation/user/64b1f8e4e9b9c1a234567891/removeConversation/64b1f8e4e9b9c1a234567890')
            .set('Origin', 'https://malicious-domain.com');

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
    });
});
