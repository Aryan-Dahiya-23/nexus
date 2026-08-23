import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { createTestApp } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb } from '../helpers/mockDb.js';

describe('Tier 1: Feature Coverage — Health & Observability Endpoints (/health/live, /health/ready)', () => {
    before(() => {
        setupMockDb();
    });

    after(() => {
        restoreMockDb();
    });

    beforeEach(() => {
        resetMockDb();
    });

    it('1. GET /health/live returns 200 OK with status "ok"', async () => {
        const app = createTestApp();
        const res = await supertest(app).get('/health/live');

        assert.equal(res.status, 200);
        assert.equal(res.body.status, 'ok');
        assert.match(res.headers['content-type'], /json/);
    });

    it('2. GET /health/live works without requiring any authentication or origin headers', async () => {
        const app = createTestApp();
        const res = await supertest(app).get('/health/live');

        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { status: 'ok' });
    });

    it('3. GET /health/ready returns 200 OK when database is connected (readyState = 1)', async () => {
        const app = createTestApp({ mockDbReadyState: 1 });
        const res = await supertest(app).get('/health/ready');

        assert.equal(res.status, 200);
        assert.equal(res.body.status, 'ready');
        assert.equal(res.body.database, 'connected');
    });

    it('4. GET /health/ready returns 503 Service Unavailable when database is disconnected (readyState = 0)', async () => {
        const app = createTestApp({ mockDbReadyState: 0 });
        const res = await supertest(app).get('/health/ready');

        assert.equal(res.status, 503);
        assert.equal(res.body.status, 'not_ready');
        assert.equal(res.body.database, 'disconnected');
    });

    it('5. GET /health/ready returns 503 Service Unavailable when database is in connecting state (readyState = 2)', async () => {
        const app = createTestApp({ mockDbReadyState: 2 });
        const res = await supertest(app).get('/health/ready');

        assert.equal(res.status, 503);
        assert.equal(res.body.status, 'not_ready');
        assert.equal(res.body.database, 'disconnected');
    });

    it('6. GET /health/ready returns 503 Service Unavailable when database is in disconnecting state (readyState = 3)', async () => {
        const app = createTestApp({ mockDbReadyState: 3 });
        const res = await supertest(app).get('/health/ready');

        assert.equal(res.status, 503);
        assert.equal(res.body.status, 'not_ready');
        assert.equal(res.body.database, 'disconnected');
    });
});
