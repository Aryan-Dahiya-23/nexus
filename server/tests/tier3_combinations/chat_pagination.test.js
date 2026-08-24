import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, createAuthenticatedAgent } from '../helpers/testApp.js';
import {
    setupMockDb,
    restoreMockDb,
    resetMockDb,
    seedUser,
    seedConversation,
    seedMessage
} from '../helpers/mockDb.js';

describe('Tier 3: End-to-End Chat Pagination & Infinite Scroll', () => {
    let app;
    let userA;
    let userB;
    let userC;

    before(() => {
        setupMockDb();
        app = createTestApp();
    });

    after(() => {
        restoreMockDb();
    });

    beforeEach(() => {
        resetMockDb();
        userA = seedUser({ fullName: 'Alice Johnson', email: 'alice@nexus.app' });
        userB = seedUser({ fullName: 'Bob Williams', email: 'bob@nexus.app' });
        userC = seedUser({ fullName: 'Charlie Davis', email: 'charlie@nexus.app' });
    });

    it('1. Opening chat with <= 10 messages loads all messages and sets hasMore to false', async () => {
        const conversation = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });

        // Seed 8 messages
        for (let i = 1; i <= 8; i++) {
            seedMessage({
                conversationId: conversation._id,
                senderId: i % 2 === 0 ? userA._id : userB._id,
                content: `Message ${i}`,
                createdAt: new Date(Date.now() - (8 - i) * 60000)
            });
        }

        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.get(`/conversation/${conversation._id}`);

        assert.equal(res.status, 200);
        assert.equal(res.body.error, false);
        assert.equal(res.body.messages.length, 8);
        assert.equal(res.body.hasMore, false);
        assert.equal(res.body.totalMessagesCount, 8);
        assert.equal(res.body.messages[0].content, 'Message 1');
        assert.equal(res.body.messages[7].content, 'Message 8');
    });

    it('2. Opening chat with 25 messages loads only the latest 10 messages and sets hasMore to true', async () => {
        const conversation = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });

        // Seed 25 messages
        for (let i = 1; i <= 25; i++) {
            seedMessage({
                conversationId: conversation._id,
                senderId: i % 2 === 0 ? userA._id : userB._id,
                content: `Message ${i}`,
                createdAt: new Date(Date.now() - (25 - i) * 60000)
            });
        }

        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.get(`/conversation/${conversation._id}`);

        assert.equal(res.status, 200);
        assert.equal(res.body.error, false);
        assert.equal(res.body.messages.length, 10);
        assert.equal(res.body.hasMore, true);
        assert.equal(res.body.totalMessagesCount, 25);

        // Initial chunk contains messages 16 to 25
        assert.equal(res.body.messages[0].content, 'Message 16');
        assert.equal(res.body.messages[9].content, 'Message 25');
    });

    it('3. Scrolling up: fetchConversationMessages loads previous page of older messages in batches of 10', async () => {
        const conversation = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });

        // Seed 25 messages
        for (let i = 1; i <= 25; i++) {
            seedMessage({
                conversationId: conversation._id,
                senderId: i % 2 === 0 ? userA._id : userB._id,
                content: `Message ${i}`,
                createdAt: new Date(Date.now() - (25 - i) * 60000)
            });
        }

        const agentA = createAuthenticatedAgent(app, userA);
        const initialRes = await agentA.get(`/conversation/${conversation._id}`);
        const earliestMessage = initialRes.body.messages[0];

        // Fetch older messages before the earliest message (batch 2: messages 6 to 15)
        const olderRes = await agentA.get(`/conversation/${conversation._id}/messages?before=${earliestMessage.createdAt}&limit=10`);

        assert.equal(olderRes.status, 200);
        assert.equal(olderRes.body.error, false);
        assert.equal(olderRes.body.messages.length, 10);
        assert.equal(olderRes.body.hasMore, true); // Still messages 1 to 5 left
        assert.equal(olderRes.body.messages[0].content, 'Message 6');
        assert.equal(olderRes.body.messages[9].content, 'Message 15');

        // Fetch final older messages (batch 3: messages 1 to 5)
        const finalRes = await agentA.get(`/conversation/${conversation._id}/messages?before=${olderRes.body.messages[0].createdAt}&limit=10`);

        assert.equal(finalRes.status, 200);
        assert.equal(finalRes.body.error, false);
        assert.equal(finalRes.body.messages.length, 5);
        assert.equal(finalRes.body.hasMore, false); // Reached beginning
        assert.equal(finalRes.body.messages[0].content, 'Message 1');
        assert.equal(finalRes.body.messages[4].content, 'Message 5');
    });

    it('4. Non-participant User C is forbidden from reading paginated messages', async () => {
        const conversation = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });

        const agentC = createAuthenticatedAgent(app, userC);
        const res = await agentC.get(`/conversation/${conversation._id}/messages`);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /forbidden|participant/i);
    });
});
