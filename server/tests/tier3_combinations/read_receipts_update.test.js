import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, createAuthenticatedAgent } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser, seedConversation, seedMessage, getMockMessage } from '../helpers/mockDb.js';

describe('Tier 3: Cross-Feature Combinations — Multi-Message Read Receipts Atomic Update', () => {
    let app;
    let userA;
    let userB;
    let userC;
    let conversationAB;
    let messageIds;

    before(() => {
        setupMockDb();
        app = createTestApp();
    });

    after(() => {
        restoreMockDb();
    });

    beforeEach(() => {
        resetMockDb();
        userA = seedUser({ fullName: 'Alice Reader' });
        userB = seedUser({ fullName: 'Bob Sender' });
        userC = seedUser({ fullName: 'Charlie Outsider' });

        conversationAB = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id],
            messages: []
        });

        messageIds = [];
        // Seed 4 messages from Bob to Alice
        for (let i = 1; i <= 4; i++) {
            const msg = seedMessage({
                senderId: userB._id,
                content: `Message ${i} from Bob`,
                seenBy: [userB._id]
            });
            messageIds.push(msg._id.toString());
        }

        // Seed 1 message from Alice to Bob
        const aliceMsg = seedMessage({
            senderId: userA._id,
            content: 'Message 5 from Alice',
            seenBy: [userA._id]
        });
        messageIds.push(aliceMsg._id.toString());

        conversationAB.messages = messageIds;
        conversationAB.lastMessage = aliceMsg._id;
    });

    it('1. Alice calls read-conversation -> 200 OK and marks messages as read', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.put(`/conversation/read-conversation/${conversationAB._id}`);

        assert.equal(res.status, 200);
        assert.equal(res.body.error, false);
        assert.match(res.body.message, /marked as read/i);
    });

    it('2. Alice reading conversation marks all unread messages from Bob with seenBy', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA.put(`/conversation/read-conversation/${conversationAB._id}`);
        assert.equal(res.status, 200);

        // Verify that all unread messages from Bob in conversationAB now have userA in seenBy
        for (let i = 0; i < 4; i++) {
            const msg = getMockMessage(messageIds[i]);
            assert.ok(msg, `Message ${i} should exist`);
            assert.ok(msg.seenBy.includes(userA._id.toString()), `Message ${i} should be marked as seen by Alice`);
        }
    });

    it('3. Repeated calls to read-conversation are idempotent', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res1 = await agentA.put(`/conversation/read-conversation/${conversationAB._id}`);
        const res2 = await agentA.put(`/conversation/read-conversation/${conversationAB._id}`);

        assert.equal(res1.status, 200);
        assert.equal(res2.status, 200);
    });

    it('4. Outsider User C cannot mark messages as read in Conversation AB (403 Forbidden)', async () => {
        const agentC = createAuthenticatedAgent(app, userC);
        const res = await agentC.put(`/conversation/read-conversation/${conversationAB._id}`);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
    });
});
