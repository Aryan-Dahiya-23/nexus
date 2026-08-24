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

    it('1. Opening chat with <= 30 messages loads all messages and sets hasMore to false', async () => {
        const conversation = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });

        // Seed 10 messages
        for (let i = 1; i <= 10; i++) {
            seedMessage({
                conversationId: conversation._id,
                senderId: i % 2 === 0 ? userA._id : userB._id,
                content: `Message ${i}`,
                createdAt: new Date(Date.now() - (10 - i) * 60000)
            });
        }

        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.get(`/conversation/${conversation._id}`);

        assert.equal(res.status, 200);
        assert.equal(res.body.error, false);
        assert.equal(res.body.messages.length, 10);
        assert.equal(res.body.hasMore, false);
        assert.equal(res.body.totalMessagesCount, 10);
        assert.equal(res.body.messages[0].content, 'Message 1');
        assert.equal(res.body.messages[9].content, 'Message 10');
    });

    it('2. Opening chat with 50 messages loads only the latest 30 messages and sets hasMore to true', async () => {
        const conversation = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });

        // Seed 50 messages
        for (let i = 1; i <= 50; i++) {
            seedMessage({
                conversationId: conversation._id,
                senderId: i % 2 === 0 ? userA._id : userB._id,
                content: `Message ${i}`,
                createdAt: new Date(Date.now() - (50 - i) * 60000)
            });
        }

        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.get(`/conversation/${conversation._id}`);

        assert.equal(res.status, 200);
        assert.equal(res.body.error, false);
        assert.equal(res.body.messages.length, 30);
        assert.equal(res.body.hasMore, true);
        assert.equal(res.body.totalMessagesCount, 50);

        // Initial chunk contains messages 21 to 50
        assert.equal(res.body.messages[0].content, 'Message 21');
        assert.equal(res.body.messages[29].content, 'Message 50');
    });

    it('3. Scrolling up: fetchConversationMessages loads previous page of older messages in batches of 30', async () => {
        const conversation = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });

        // Seed 50 messages
        for (let i = 1; i <= 50; i++) {
            seedMessage({
                conversationId: conversation._id,
                senderId: i % 2 === 0 ? userA._id : userB._id,
                content: `Message ${i}`,
                createdAt: new Date(Date.now() - (50 - i) * 60000)
            });
        }

        const agentA = createAuthenticatedAgent(app, userA);
        const initialRes = await agentA.get(`/conversation/${conversation._id}`);
        const earliestMessage = initialRes.body.messages[0];

        // Fetch older messages before the earliest message (remaining 20 messages)
        const olderRes = await agentA.get(`/conversation/${conversation._id}/messages?before=${earliestMessage.createdAt}&limit=30`);

        assert.equal(olderRes.status, 200);
        assert.equal(olderRes.body.error, false);
        assert.equal(olderRes.body.messages.length, 20);
        assert.equal(olderRes.body.hasMore, false);
        assert.equal(olderRes.body.messages[0].content, 'Message 1');
        assert.equal(olderRes.body.messages[19].content, 'Message 20');
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
