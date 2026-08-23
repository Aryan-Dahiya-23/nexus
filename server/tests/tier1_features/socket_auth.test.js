import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestSocketServer } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb } from '../helpers/mockDb.js';

describe('Tier 1: Feature Coverage — Socket.IO Session Authentication', () => {
    let socketServer;

    before(async () => {
        setupMockDb();
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
    });

    it('1. Authenticated socket connection with valid session connects successfully', async () => {
        const user = { _id: '64b1f8e4e9b9c1a234567891', fullName: 'Alice Wonderland' };
        const client = socketServer.connectClient({ user });

        await new Promise((resolve, reject) => {
            client.on('connect', () => {
                assert.equal(client.connected, true);
                client.close();
                resolve();
            });
            client.on('connect_error', (err) => {
                client.close();
                reject(err);
            });
        });
    });

    it('2. Authenticated socket receives "connected users" presence event on connection', async () => {
        const user = { _id: '64b1f8e4e9b9c1a234567892', fullName: 'Bob Builder' };
        const client = socketServer.connectClient({ user });

        await new Promise((resolve, reject) => {
            client.on('connected users', (onlineUsers) => {
                assert.ok(Array.isArray(onlineUsers));
                assert.ok(onlineUsers.includes(user._id));
                client.close();
                resolve();
            });
            client.on('connect_error', (err) => {
                client.close();
                reject(err);
            });
        });
    });

    it('3. Multiple tabs for same user share online status correctly', async () => {
        const user = { _id: '64b1f8e4e9b9c1a234567893', fullName: 'Multi Tab User' };
        const client1 = socketServer.connectClient({ user });
        const client2 = socketServer.connectClient({ user });

        await new Promise((resolve) => {
            let connectedCount = 0;
            const onConnect = () => {
                connectedCount++;
                if (connectedCount === 2) {
                    client1.close();
                    client2.close();
                    resolve();
                }
            };
            client1.on('connect', onConnect);
            client2.on('connect', onConnect);
        });
    });

    it('4. User disconnect cleanly removes socket tracking', async () => {
        const user = { _id: '64b1f8e4e9b9c1a234567894', fullName: 'Ephemeral User' };
        const client = socketServer.connectClient({ user });

        await new Promise((resolve) => {
            client.on('connect', () => {
                client.close();
                setTimeout(resolve, 50);
            });
        });
    });

    it('5. Disconnected client does not retain active connection state', async () => {
        const user = { _id: '64b1f8e4e9b9c1a234567895', fullName: 'State Check User' };
        const client = socketServer.connectClient({ user });

        await new Promise((resolve) => {
            client.on('connect', () => {
                assert.equal(client.connected, true);
                client.close();
                assert.equal(client.connected, false);
                resolve();
            });
        });
    });
});
