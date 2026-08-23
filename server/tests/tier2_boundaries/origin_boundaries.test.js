import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { createTestApp } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb } from '../helpers/mockDb.js';

describe('Tier 2: Boundary & Corner Cases — Origin Verification & CSRF Spoofing Defense', () => {
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

    it('1. Subdomain suffix lookalike "https://nexus-aryan.vercel.app.attacker.com" returns 403 Forbidden', async () => {
        const res = await request
            .post('/conversation/create-conversation')
            .set('Origin', 'https://nexus-aryan.vercel.app.attacker.com')
            .send({ receiverId: '64b1f8e4e9b9c1a234567891' });

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /forbidden|invalid.*origin/i);
    });

    it('2. Hyphenated domain lookalike "https://nexus-aryan.vercel.app-evil.com" returns 403 Forbidden', async () => {
        const res = await request
            .post('/conversation/create-conversation')
            .set('Origin', 'https://nexus-aryan.vercel.app-evil.com')
            .send({ receiverId: '64b1f8e4e9b9c1a234567891' });

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
    });

    it('3. Localhost lookalike "http://localhost:5174.attacker.com" returns 403 Forbidden', async () => {
        const res = await request
            .post('/conversation/create-conversation')
            .set('Origin', 'http://localhost:5174.attacker.com')
            .send({ receiverId: '64b1f8e4e9b9c1a234567891' });

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
    });

    it('4. Wrong port on localhost "http://localhost:5175" returns 403 Forbidden', async () => {
        const res = await request
            .post('/conversation/create-conversation')
            .set('Origin', 'http://localhost:5175')
            .send({ receiverId: '64b1f8e4e9b9c1a234567891' });

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
    });

    it('5. Malformed non-URL Origin string "not-a-valid-url" returns 403 Forbidden', async () => {
        const res = await request
            .post('/conversation/create-conversation')
            .set('Origin', 'not-a-valid-url')
            .send({ receiverId: '64b1f8e4e9b9c1a234567891' });

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
    });

    it('6. Missing Origin and missing Referer on state-mutating POST returns 403 Forbidden', async () => {
        const res = await request
            .post('/conversation/create-conversation')
            .send({ receiverId: '64b1f8e4e9b9c1a234567891' });

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
    });

    it('7. Missing Origin and missing Referer on state-mutating PUT returns 403 Forbidden', async () => {
        const res = await request
            .put('/conversation/read-conversation/64b1f8e4e9b9c1a234567890');

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
    });

    it('8. Safe read methods (GET) are NOT blocked by CSRF middleware even with attacker Origin', async () => {
        const res = await request
            .get('/health/live')
            .set('Origin', 'https://nexus-aryan.vercel.app.attacker.com');

        // GET requests to public health endpoint are not state-mutating
        assert.equal(res.status, 200);
        assert.equal(res.body.status, 'ok');
    });
});
