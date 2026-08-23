import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, createAuthenticatedAgent } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser, getMockUser } from '../helpers/mockDb.js';

describe('Tier 3: Cross-Feature Combinations — Group Creation & Multi-User Verification Workflow', () => {
    let app;
    let userA;
    let userB;
    let userC;
    let userD;

    before(() => {
        setupMockDb();
        app = createTestApp();
    });

    after(() => {
        restoreMockDb();
    });

    beforeEach(() => {
        resetMockDb();
        userA = seedUser({ fullName: 'Alice Admin' });
        userB = seedUser({ fullName: 'Bob Dev' });
        userC = seedUser({ fullName: 'Charlie QA' });
        userD = seedUser({ fullName: 'Dave Outsider' });
    });

    it('1. Creator User A creates group chat with valid Users B & C -> 201 Created', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .post('/conversation/create-group-conversation')
            .send({
                name: 'Engineering Team',
                participants: [userB._id.toString(), userC._id.toString()]
            });

        assert.equal(res.status, 201);
        assert.equal(res.body.error, false);
        assert.equal(res.body.chat.type, 'group');
        assert.equal(res.body.chat.name, 'Engineering Team');
        assert.equal(res.body.chat.participants.length, 3);
    });

    it('2. Group conversation is automatically linked in all members user records', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .post('/conversation/create-group-conversation')
            .send({
                name: 'Core Squad',
                participants: [userB._id.toString(), userC._id.toString()]
            });

        assert.equal(res.status, 201);
        const groupId = res.body.chat._id.toString();

        const updatedUserA = getMockUser(userA._id);
        const updatedUserB = getMockUser(userB._id);
        const updatedUserC = getMockUser(userC._id);

        assert.ok(updatedUserA.conversations.some(c => c.conversation.toString() === groupId));
        assert.ok(updatedUserB.conversations.some(c => c.conversation.toString() === groupId));
        assert.ok(updatedUserC.conversations.some(c => c.conversation.toString() === groupId));
    });

    it('3. Member User B can post messages into the group conversation -> 200 OK', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const createRes = await agentA
            .post('/conversation/create-group-conversation')
            .send({
                name: 'Dev Discussions',
                participants: [userB._id.toString(), userC._id.toString()]
            });

        const groupId = createRes.body.chat._id.toString();

        const agentB = createAuthenticatedAgent(app, userB);
        const msgRes = await agentB
            .post(`/conversation/create-message/${groupId}`)
            .send({
                message: {
                    content: 'Hello team, build is ready!',
                    type: 'text'
                }
            });

        assert.equal(msgRes.status, 200);
        assert.equal(msgRes.body.error, false);
        assert.equal(msgRes.body.data.content, 'Hello team, build is ready!');
    });

    it('4. Non-member User D is blocked from reading or messaging the group (403 Forbidden)', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const createRes = await agentA
            .post('/conversation/create-group-conversation')
            .send({
                name: 'Private Core',
                participants: [userB._id.toString()]
            });

        const groupId = createRes.body.chat._id.toString();

        const agentD = createAuthenticatedAgent(app, userD);

        // Read attempt
        const readRes = await agentD.get(`/conversation/${groupId}`);
        assert.equal(readRes.status, 403);
        assert.equal(readRes.body.error, true);

        // Write attempt
        const writeRes = await agentD
            .post(`/conversation/create-message/${groupId}`)
            .send({
                message: {
                    content: 'Intrusion message',
                    type: 'text'
                }
            });
        assert.equal(writeRes.status, 403);
        assert.equal(writeRes.body.error, true);
    });
});
