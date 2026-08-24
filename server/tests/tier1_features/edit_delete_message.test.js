import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, createAuthenticatedAgent, createTestSocketServer } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb, seedUser, seedConversation, seedMessage } from '../helpers/mockDb.js';

describe('Tier 1: Feature Coverage — Edit & Delete Message Lifecycle & IDOR Boundaries', () => {
    let app;
    let socketServer;
    let userA;
    let userB;
    let userC;
    let conversationAB;
    let messageA;
    let mediaMessageA;

    before(async () => {
        setupMockDb();
        app = createTestApp();
        socketServer = await createTestSocketServer();
    });

    after(async () => {
        restoreMockDb();
        if (socketServer) {
            await socketServer.cleanup();
        }
    });

    beforeEach(() => {
        resetMockDb();
        userA = seedUser({ fullName: 'Alice Sender' });
        userB = seedUser({ fullName: 'Bob Receiver' });
        userC = seedUser({ fullName: 'Charlie Outsider' });

        conversationAB = seedConversation({
            type: 'personal',
            participants: [userA._id, userB._id]
        });

        messageA = seedMessage({
            senderId: userA._id,
            content: 'Original message text from Alice',
            type: 'text',
            conversationId: conversationAB._id
        });

        mediaMessageA = seedMessage({
            senderId: userA._id,
            content: 'sample_image_id_12345',
            type: 'image',
            conversationId: conversationAB._id
        });
    });

    it('1. Alice can edit her own text message -> 200 OK with isEdited true and updated content', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .put(`/conversation/${conversationAB._id}/message/${messageA._id}`)
            .send({ content: 'Updated message text by Alice' });

        assert.equal(res.status, 200);
        assert.equal(res.body.error, false);
        assert.equal(res.body.data.content, 'Updated message text by Alice');
        assert.equal(res.body.data.isEdited, true);
        assert.ok(res.body.data.editedAt);
    });

    it('2. Bob cannot edit Alice message -> 403 Forbidden', async () => {
        const agentB = createAuthenticatedAgent(app, userB);
        const res = await agentB
            .put(`/conversation/${conversationAB._id}/message/${messageA._id}`)
            .send({ content: 'Bob trying to tamper Alice message' });

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /only edit your own/i);
    });

    it('3. Charlie outsider cannot edit Alice message in Conversation AB -> 403 Forbidden', async () => {
        const agentC = createAuthenticatedAgent(app, userC);
        const res = await agentC
            .put(`/conversation/${conversationAB._id}/message/${messageA._id}`)
            .send({ content: 'Charlie trying to edit' });

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /not a participant/i);
    });

    it('4. Attempting to edit a media image/video message returns 400 Bad Request', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .put(`/conversation/${conversationAB._id}/message/${mediaMessageA._id}`)
            .send({ content: 'Trying to change media asset' });

        assert.equal(res.status, 400);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /only text messages can be edited/i);
    });

    it('5. Attempting to edit with empty or whitespace-only content returns 400 Bad Request', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .put(`/conversation/${conversationAB._id}/message/${messageA._id}`)
            .send({ content: '   ' });

        assert.equal(res.status, 400);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /content is required/i);
    });

    it('6. Alice can delete her own message (WhatsApp style) -> 200 OK with isDeleted true', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        const res = await agentA
            .delete(`/conversation/${conversationAB._id}/message/${messageA._id}`);

        assert.equal(res.status, 200);
        assert.equal(res.body.error, false);
        assert.equal(res.body.data.isDeleted, true);
        assert.equal(res.body.data.content, 'This message was deleted');
        assert.ok(res.body.data.deletedAt);
    });

    it('7. Cannot edit a deleted message -> 400 Bad Request', async () => {
        const agentA = createAuthenticatedAgent(app, userA);
        // First delete the message
        await agentA.delete(`/conversation/${conversationAB._id}/message/${messageA._id}`);

        // Now try to edit the deleted message
        const editRes = await agentA
            .put(`/conversation/${conversationAB._id}/message/${messageA._id}`)
            .send({ content: 'Trying to resurrect message' });

        assert.equal(editRes.status, 400);
        assert.equal(editRes.body.error, true);
        assert.match(editRes.body.message, /cannot edit a deleted message/i);
    });

    it('8. Bob cannot delete Alice message -> 403 Forbidden', async () => {
        const agentB = createAuthenticatedAgent(app, userB);
        const res = await agentB
            .delete(`/conversation/${conversationAB._id}/message/${messageA._id}`);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /only delete your own/i);
    });

    it('9. Charlie outsider cannot delete Alice message in Conversation AB -> 403 Forbidden', async () => {
        const agentC = createAuthenticatedAgent(app, userC);
        const res = await agentC
            .delete(`/conversation/${conversationAB._id}/message/${messageA._id}`);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, true);
        assert.match(res.body.message, /not a participant/i);
    });

    it('10. Socket "edit message" event broadcasts "message edited" to conversation participants', async () => {
        const clientA = socketServer.connectClient({ user: userA });
        const clientB = socketServer.connectClient({ user: userB });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                clientA.close();
                clientB.close();
                reject(new Error('Timeout waiting for message edited socket event'));
            }, 2000);

            clientB.on('message edited', (convId, updatedMsg) => {
                try {
                    assert.equal(convId, conversationAB._id.toString());
                    assert.equal(updatedMsg._id, messageA._id.toString());
                    assert.equal(updatedMsg.content, 'Realtime edited text');
                    clearTimeout(timeout);
                    clientA.close();
                    clientB.close();
                    resolve();
                } catch (err) {
                    clearTimeout(timeout);
                    clientA.close();
                    clientB.close();
                    reject(err);
                }
            });

            const tryEmit = () => {
                if (clientA.connected && clientB.connected) {
                    clientA.emit('edit message', conversationAB._id.toString(), {
                        _id: messageA._id.toString(),
                        content: 'Realtime edited text',
                        isEdited: true
                    });
                }
            };

            clientA.on('connect', tryEmit);
            clientB.on('connect', tryEmit);
            tryEmit();
        });
    });

    it('11. Socket "delete message" event broadcasts "message deleted" to conversation participants', async () => {
        const clientA = socketServer.connectClient({ user: userA });
        const clientB = socketServer.connectClient({ user: userB });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                clientA.close();
                clientB.close();
                reject(new Error('Timeout waiting for message deleted socket event'));
            }, 2000);

            clientB.on('message deleted', (convId, deletedMsg) => {
                try {
                    assert.equal(convId, conversationAB._id.toString());
                    assert.equal(deletedMsg._id, messageA._id.toString());
                    assert.equal(deletedMsg.isDeleted, true);
                    clearTimeout(timeout);
                    clientA.close();
                    clientB.close();
                    resolve();
                } catch (err) {
                    clearTimeout(timeout);
                    clientA.close();
                    clientB.close();
                    reject(err);
                }
            });

            const tryEmit = () => {
                if (clientA.connected && clientB.connected) {
                    clientA.emit('delete message', conversationAB._id.toString(), {
                        _id: messageA._id.toString(),
                        isDeleted: true,
                        content: 'This message was deleted'
                    });
                }
            };

            clientA.on('connect', tryEmit);
            clientB.on('connect', tryEmit);
            tryEmit();
        });
    });
});
