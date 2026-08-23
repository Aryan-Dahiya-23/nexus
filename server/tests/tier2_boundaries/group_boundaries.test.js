import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, createAuthenticatedAgent } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser, seedConversation } from '../helpers/mockDb.js';

describe('Tier 2: Boundary & Corner Cases — Group & Message Creation Parameter Boundaries', () => {
    let app;
    let userA;
    let userB;
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
        userA = seedUser({ fullName: 'Alice Creator' });
        userB = seedUser({ fullName: 'Bob Member' });

        conversationAB = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });
    });

    it('1. Group creation with non-existent participant ID returns 400 Bad Request', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const phantomId = '64b1f8e4e9b9c1a234567899'; // does not exist in DB

        const res = await agentA
            .post('/conversation/create-group-conversation')
            .send({
                name: 'Phantom Group',
                participants: [userB._id, phantomId]
            });

        // Validation must reject non-existent user IDs
        assert.equal(res.status, 400);
        assert.equal(res.body.error, true);
    });

    it('2. Group creation with invalid ObjectId format returns 400 Bad Request', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .post('/conversation/create-group-conversation')
            .send({
                name: 'Bad ID Group',
                participants: ['invalid_hex_id']
            });

        assert.equal(res.status, 400);
        assert.equal(res.body.error, true);
    });

    it('3. Group creation with empty string name returns 400 Bad Request', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .post('/conversation/create-group-conversation')
            .send({
                name: '',
                participants: [userB._id]
            });

        assert.equal(res.status, 400);
        assert.equal(res.body.error, true);
    });

    it('4. Group creation with whitespace-only name returns 400 Bad Request', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .post('/conversation/create-group-conversation')
            .send({
                name: '    ',
                participants: [userB._id]
            });

        assert.equal(res.status, 400);
        assert.equal(res.body.error, true);
    });

    it('5. Group creation with empty participants array returns 400 Bad Request', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .post('/conversation/create-group-conversation')
            .send({
                name: 'No Members Group',
                participants: []
            });

        assert.equal(res.status, 400);
        assert.equal(res.body.error, true);
    });

    it('6. Group creation with non-array participants returns 400 Bad Request', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .post('/conversation/create-group-conversation')
            .send({
                name: 'String Participants Group',
                participants: 'not_an_array'
            });

        assert.equal(res.status, 400);
        assert.equal(res.body.error, true);
    });

    it('7. Message creation with text exceeding 5000 characters returns 400 Bad Request', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const longContent = 'A'.repeat(5001);

        const res = await agentA
            .post(`/conversation/create-message/${conversationAB._id}`)
            .send({
                message: {
                    content: longContent,
                    type: 'text'
                }
            });

        assert.equal(res.status, 400);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /exceeds maximum length/i);
    });

    it('8. Message creation with invalid message type returns 400 Bad Request', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .post(`/conversation/create-message/${conversationAB._id}`)
            .send({
                message: {
                    content: 'Valid content',
                    type: 'executable_payload'
                }
            });

        assert.equal(res.status, 400);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /invalid message type/i);
    });
});
