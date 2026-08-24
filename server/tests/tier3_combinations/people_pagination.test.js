import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
    createTestApp,
    createAuthenticatedAgent,
    createUnauthenticatedAgent,
    createTestSocketServer
} from '../helpers/testApp.js';
import {
    setupMockDb,
    restoreMockDb,
    resetMockDb,
    seedUser
} from '../helpers/mockDb.js';

describe('Tier 3: End-to-End People Directory Pagination, Search & Real-Time Presence', () => {
    let app;
    let socketServer;
    let currentUser;
    let testUsers = [];
    const activeSockets = [];

    const USER_NAMES = [
        'Alice Adams',
        'Alice Cooper',
        'Alice Walker',
        'Bob Barker',
        'Bob Dylan',
        'Bob Marley',
        'Charlie Brown',
        'Charlie Chaplin',
        'David Beckham',
        'David Bowie',
        'Emma Stone',
        'Emma Watson',
        'Frank Sinatra',
        'Grace Hopper',
        'Hannah Abbott',
        'Ian McKellen',
        'Jack Sparrow',
        'Karen Gillan',
        'Leo Tolstoy',
        'Mona Lisa',
        'Nina Simone',
        'Oscar Wilde',
        'Paul McCartney',
        'Queen Elizabeth',
        'Robert DeNiro',
        'Special [User].*+?',
        'Special (Parenthesis)'
    ];

    before(async () => {
        setupMockDb();
        app = createTestApp();
        socketServer = await createTestSocketServer();
    });

    after(async () => {
        for (const sock of activeSockets) {
            if (sock && sock.connected) {
                sock.close();
            }
        }
        if (socketServer) {
            await socketServer.cleanup();
        }
        restoreMockDb();
    });

    beforeEach(() => {
        // Disconnect all sockets from previous tests
        while (activeSockets.length > 0) {
            const sock = activeSockets.pop();
            if (sock && sock.connected) {
                sock.close();
            }
        }

        resetMockDb();

        currentUser = seedUser({
            fullName: 'Main Requester',
            email: 'main_requester@nexus.app',
            picture: 'https://nexus.app/avatars/main.png'
        });

        testUsers = USER_NAMES.map((name, index) => {
            return seedUser({
                fullName: name,
                email: `user_${index + 1}@nexus.app`,
                picture: `https://nexus.app/avatars/user_${index + 1}.png`
            });
        });
    });

    // Helper to connect an online user socket
    const connectUserSocket = async (user) => {
        const client = socketServer.connectClient({ user });
        activeSockets.push(client);
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Socket connect timeout')), 3000);
            client.on('connect', () => {
                clearTimeout(timer);
                resolve();
            });
            client.on('connect_error', (err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
        // Small grace period for socket map registration
        await new Promise((resolve) => setTimeout(resolve, 30));
        return client;
    };

    // Helper to disconnect a socket
    const disconnectUserSocket = async (client) => {
        if (client && client.connected) {
            client.close();
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    };

    // =========================================================================
    // Tier 1: Feature Coverage & API Contracts
    // =========================================================================
    describe('Tier 1: Feature Coverage & API Contracts', () => {
        it('1. Default GET /auth/people returns 20 users with standard pagination metadata', async () => {
            const agent = createAuthenticatedAgent(app, currentUser);
            const res = await agent.get('/auth/people');

            assert.equal(res.status, 200);
            assert.equal(res.body.error, false);
            assert.equal(Array.isArray(res.body.users), true);
            assert.equal(res.body.users.length, 20);
            assert.equal(res.body.totalUsers, 27);
            assert.equal(res.body.totalPages, 2);
            assert.equal(res.body.currentPage, 1);
            assert.equal(res.body.hasMore, true);

            // Verify payload fields
            const firstUser = res.body.users[0];
            assert.ok(firstUser._id);
            assert.ok(firstUser.fullName);
            assert.ok(firstUser.picture);
            assert.equal(firstUser.password, undefined);

            // Verify alphabetical sort
            for (let i = 1; i < res.body.users.length; i++) {
                const prev = res.body.users[i - 1].fullName;
                const curr = res.body.users[i].fullName;
                assert.ok(prev.localeCompare(curr) <= 0, `Users not sorted: "${prev}" before "${curr}"`);
            }
        });

        it('2. Custom page and limit returns exact page slice and recalculates totalPages & hasMore', async () => {
            const agent = createAuthenticatedAgent(app, currentUser);
            const res = await agent.get('/auth/people?page=2&limit=5');

            assert.equal(res.status, 200);
            assert.equal(res.body.error, false);
            assert.equal(res.body.users.length, 5);
            assert.equal(res.body.totalUsers, 27);
            assert.equal(res.body.totalPages, 6); // Math.ceil(27 / 5) = 6
            assert.equal(res.body.currentPage, 2);
            assert.equal(res.body.hasMore, true);
        });

        it('3. Server-side search filter matches fullName case-insensitively', async () => {
            const agent = createAuthenticatedAgent(app, currentUser);
            const res = await agent.get('/auth/people?search=alice');

            assert.equal(res.status, 200);
            assert.equal(res.body.error, false);
            assert.equal(res.body.totalUsers, 3);
            assert.equal(res.body.totalPages, 1);
            assert.equal(res.body.currentPage, 1);
            assert.equal(res.body.hasMore, false);
            assert.equal(res.body.users.length, 3);

            const names = res.body.users.map((u) => u.fullName);
            assert.deepEqual(names, ['Alice Adams', 'Alice Cooper', 'Alice Walker']);
        });

        it('4. Self-User is strictly excluded from directory results and total count', async () => {
            const agent = createAuthenticatedAgent(app, currentUser);
            const res = await agent.get('/auth/people?limit=50');

            assert.equal(res.status, 200);
            assert.equal(res.body.totalUsers, 27);
            const ids = res.body.users.map((u) => u._id.toString());
            assert.equal(ids.includes(currentUser._id.toString()), false);
        });

        it('5. Unauthenticated request to GET /auth/people returns 401 Unauthorized', async () => {
            const unauthAgent = createUnauthenticatedAgent(app);
            const res = await unauthAgent.get('/auth/people');

            assert.equal(res.status, 401);
            assert.equal(res.body.error, true);
        });

        it('6. Online tab filter (tab=online) returns only active connected socket users', async () => {
            const userBobMarley = testUsers.find((u) => u.fullName === 'Bob Marley');
            const userEmmaWatson = testUsers.find((u) => u.fullName === 'Emma Watson');

            // Connect Bob and Emma to the socket server
            await connectUserSocket(userBobMarley);
            await connectUserSocket(userEmmaWatson);

            const agent = createAuthenticatedAgent(app, currentUser);
            const res = await agent.get('/auth/people?tab=online');

            assert.equal(res.status, 200);
            assert.equal(res.body.error, false);
            assert.equal(res.body.totalUsers, 2);
            assert.equal(res.body.totalPages, 1);
            assert.equal(res.body.hasMore, false);

            const onlineNames = res.body.users.map((u) => u.fullName).sort();
            assert.deepEqual(onlineNames, ['Bob Marley', 'Emma Watson']);
        });

        it('7. Requesting user with active socket is excluded from online tab results', async () => {
            const userDavidBowie = testUsers.find((u) => u.fullName === 'David Bowie');

            // Connect requesting user and David Bowie
            await connectUserSocket(currentUser);
            await connectUserSocket(userDavidBowie);

            const agent = createAuthenticatedAgent(app, currentUser);
            const res = await agent.get('/auth/people?tab=online');

            assert.equal(res.status, 200);
            assert.equal(res.body.totalUsers, 1);
            assert.equal(res.body.users[0].fullName, 'David Bowie');
            const ids = res.body.users.map((u) => u._id.toString());
            assert.equal(ids.includes(currentUser._id.toString()), false);
        });
    });

    // =========================================================================
    // Tier 2: Boundary & Corner Cases
    // =========================================================================
    describe('Tier 2: Boundary & Corner Cases', () => {
        it('1. Zero and negative page numbers are safely clamped to page 1', async () => {
            const agent = createAuthenticatedAgent(app, currentUser);

            const res0 = await agent.get('/auth/people?page=0&limit=10');
            assert.equal(res0.status, 200);
            assert.equal(res0.body.currentPage, 1);
            assert.equal(res0.body.users.length, 10);

            const resNeg = await agent.get('/auth/people?page=-15&limit=10');
            assert.equal(resNeg.status, 200);
            assert.equal(resNeg.body.currentPage, 1);
            assert.equal(resNeg.body.users.length, 10);

            const resNan = await agent.get('/auth/people?page=not_a_number&limit=10');
            assert.equal(resNan.status, 200);
            assert.equal(resNan.body.currentPage, 1);
            assert.equal(resNan.body.users.length, 10);
        });

        it('2. Limit parameter is bounded between minimum 1 and maximum 50', async () => {
            const agent = createAuthenticatedAgent(app, currentUser);

            // limit=0 clamped to 1
            const res0 = await agent.get('/auth/people?limit=0');
            assert.equal(res0.status, 200);
            assert.equal(res0.body.users.length, 1);

            // limit=100 clamped to 50
            const res100 = await agent.get('/auth/people?limit=100');
            assert.equal(res100.status, 200);
            assert.equal(res100.body.users.length, 27); // Total 27 users fit within 50
            assert.equal(res100.body.totalPages, 1);
            assert.equal(res100.body.hasMore, false);

            // limit=-5 clamped to 1
            const resNeg = await agent.get('/auth/people?limit=-5');
            assert.equal(resNeg.status, 200);
            assert.equal(resNeg.body.users.length, 1);

            // non-numeric limit defaults to 20
            const resInvalid = await agent.get('/auth/people?limit=abc');
            assert.equal(resInvalid.status, 200);
            assert.equal(resInvalid.body.users.length, 20);
        });

        it('3. Page number exceeding totalPages returns empty users array and hasMore false', async () => {
            const agent = createAuthenticatedAgent(app, currentUser);
            const res = await agent.get('/auth/people?page=99&limit=10');

            assert.equal(res.status, 200);
            assert.equal(res.body.users.length, 0);
            assert.equal(res.body.totalUsers, 27);
            assert.equal(res.body.totalPages, 3);
            assert.equal(res.body.currentPage, 99);
            assert.equal(res.body.hasMore, false);
        });

        it('4. Search query with regex metacharacters does not crash and performs literal substring match', async () => {
            const agent = createAuthenticatedAgent(app, currentUser);

            // Test searching for literal "[User]"
            const resBracket = await agent.get('/auth/people?search=[User]');
            assert.equal(resBracket.status, 200);
            assert.equal(resBracket.body.users.length, 1);
            assert.equal(resBracket.body.users[0].fullName, 'Special [User].*+?');

            // Test searching for literal "(Parenthesis)"
            const resParen = await agent.get('/auth/people?search=(Parenthesis)');
            assert.equal(resParen.status, 200);
            assert.equal(resParen.body.users.length, 1);
            assert.equal(resParen.body.users[0].fullName, 'Special (Parenthesis)');

            // Test searching for ReDoS injection attempt or unclosed bracket
            const resSpecial = await agent.get('/auth/people?search=.*+?^${}()|[]\\');
            assert.equal(resSpecial.status, 200);
            assert.equal(resSpecial.body.error, false);
        });

        it('5. Empty database with 0 other users returns empty list and totalPages 0', async () => {
            resetMockDb();
            const loneUser = seedUser({ fullName: 'Lone User', email: 'lone@nexus.app' });

            const agent = createAuthenticatedAgent(app, loneUser);
            const res = await agent.get('/auth/people');

            assert.equal(res.status, 200);
            assert.equal(res.body.error, false);
            assert.equal(res.body.users.length, 0);
            assert.equal(res.body.totalUsers, 0);
            assert.equal(res.body.totalPages, 0);
            assert.equal(res.body.currentPage, 1);
            assert.equal(res.body.hasMore, false);
        });

        it('6. Whitespace-only search string is treated as empty search (returns all users)', async () => {
            const agent = createAuthenticatedAgent(app, currentUser);
            const res = await agent.get('/auth/people?search=%20%20%20');

            assert.equal(res.status, 200);
            assert.equal(res.body.totalUsers, 27);
            assert.equal(res.body.users.length, 20);
        });
    });

    // =========================================================================
    // Tier 3: Cross-Combinations
    // =========================================================================
    describe('Tier 3: Cross-Combinations', () => {
        it('1. Combined Search + Online Tab + Pagination filters accurately', async () => {
            const userBobBarker = testUsers.find((u) => u.fullName === 'Bob Barker');
            const userBobDylan = testUsers.find((u) => u.fullName === 'Bob Dylan');
            const userBobMarley = testUsers.find((u) => u.fullName === 'Bob Marley');
            const userAliceCooper = testUsers.find((u) => u.fullName === 'Alice Cooper');

            // Connect Bob Barker, Bob Marley, and Alice Cooper (Bob Dylan stays offline)
            await connectUserSocket(userBobBarker);
            await connectUserSocket(userBobMarley);
            await connectUserSocket(userAliceCooper);

            const agent = createAuthenticatedAgent(app, currentUser);

            // Query search=bob, tab=online, limit=1
            const resPage1 = await agent.get('/auth/people?search=bob&tab=online&page=1&limit=1');
            assert.equal(resPage1.status, 200);
            assert.equal(resPage1.body.totalUsers, 2); // Bob Barker and Bob Marley
            assert.equal(resPage1.body.totalPages, 2);
            assert.equal(resPage1.body.currentPage, 1);
            assert.equal(resPage1.body.hasMore, true);
            assert.equal(resPage1.body.users.length, 1);
            assert.equal(resPage1.body.users[0].fullName, 'Bob Barker');

            // Page 2
            const resPage2 = await agent.get('/auth/people?search=bob&tab=online&page=2&limit=1');
            assert.equal(resPage2.status, 200);
            assert.equal(resPage2.body.currentPage, 2);
            assert.equal(resPage2.body.hasMore, false);
            assert.equal(resPage2.body.users.length, 1);
            assert.equal(resPage2.body.users[0].fullName, 'Bob Marley');
        });

        it('2. Multi-page sequential pagination reconstructs the exact contiguous user set without duplicates', async () => {
            const agent = createAuthenticatedAgent(app, currentUser);
            const PAGE_SIZE = 5;
            const collectedUsers = [];

            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const res = await agent.get(`/auth/people?page=${page}&limit=${PAGE_SIZE}`);
                assert.equal(res.status, 200);
                assert.equal(res.body.error, false);
                assert.equal(res.body.currentPage, page);

                for (const u of res.body.users) {
                    collectedUsers.push(u);
                }

                hasMore = res.body.hasMore;
                page++;
                // Safeguard against infinite loops in case of regression
                if (page > 20) break;
            }

            assert.equal(collectedUsers.length, 27);

            // Verify all IDs are distinct
            const userIds = collectedUsers.map((u) => u._id.toString());
            const uniqueIds = new Set(userIds);
            assert.equal(uniqueIds.size, 27);

            // Verify alphabetical sort preservation across chunk boundaries
            for (let i = 1; i < collectedUsers.length; i++) {
                const prev = collectedUsers[i - 1].fullName;
                const curr = collectedUsers[i].fullName;
                assert.ok(prev.localeCompare(curr) <= 0, `Sort violation at index ${i}: "${prev}" vs "${curr}"`);
            }
        });
    });

    // =========================================================================
    // Tier 4: Real-World Workload Scenarios
    // =========================================================================
    describe('Tier 4: Real-World Workload Scenarios', () => {
        it('1. Group Member Selector scenario: Multiple independent search queries with pagination', async () => {
            const agent = createAuthenticatedAgent(app, currentUser);

            // Query 1: Search "Charlie"
            const resCharlie = await agent.get('/auth/people?search=charlie&page=1&limit=10');
            assert.equal(resCharlie.status, 200);
            assert.equal(resCharlie.body.totalUsers, 2);
            assert.deepEqual(resCharlie.body.users.map((u) => u.fullName), ['Charlie Brown', 'Charlie Chaplin']);

            // Query 2: Search "David"
            const resDavid = await agent.get('/auth/people?search=david&page=1&limit=10');
            assert.equal(resDavid.status, 200);
            assert.equal(resDavid.body.totalUsers, 2);
            assert.deepEqual(resDavid.body.users.map((u) => u.fullName), ['David Beckham', 'David Bowie']);

            // Query 3: Search "Emma"
            const resEmma = await agent.get('/auth/people?search=emma&page=1&limit=10');
            assert.equal(resEmma.status, 200);
            assert.equal(resEmma.body.totalUsers, 2);
            assert.deepEqual(resEmma.body.users.map((u) => u.fullName), ['Emma Stone', 'Emma Watson']);

            // Query 4: Clear search (All users page 1)
            const resAll = await agent.get('/auth/people?page=1&limit=10');
            assert.equal(resAll.status, 200);
            assert.equal(resAll.body.totalUsers, 27);
            assert.equal(resAll.body.users.length, 10);
        });

        it('2. Directory Infinite Scroll & Real-Time Presence Transition scenario', async () => {
            const userIan = testUsers.find((u) => u.fullName === 'Ian McKellen');
            const userJack = testUsers.find((u) => u.fullName === 'Jack Sparrow');

            const agent = createAuthenticatedAgent(app, currentUser);

            // Initially online tab is empty
            const initialOnlineRes = await agent.get('/auth/people?tab=online');
            assert.equal(initialOnlineRes.status, 200);
            assert.equal(initialOnlineRes.body.totalUsers, 0);
            assert.equal(initialOnlineRes.body.users.length, 0);

            // User Ian comes online
            const sockIan = await connectUserSocket(userIan);

            const onlineRes1 = await agent.get('/auth/people?tab=online');
            assert.equal(onlineRes1.status, 200);
            assert.equal(onlineRes1.body.totalUsers, 1);
            assert.equal(onlineRes1.body.users[0].fullName, 'Ian McKellen');

            // User Jack comes online
            const sockJack = await connectUserSocket(userJack);

            const onlineRes2 = await agent.get('/auth/people?tab=online');
            assert.equal(onlineRes2.status, 200);
            assert.equal(onlineRes2.body.totalUsers, 2);
            assert.deepEqual(onlineRes2.body.users.map((u) => u.fullName), ['Ian McKellen', 'Jack Sparrow']);

            // User Ian goes offline
            await disconnectUserSocket(sockIan);

            const onlineRes3 = await agent.get('/auth/people?tab=online');
            assert.equal(onlineRes3.status, 200);
            assert.equal(onlineRes3.body.totalUsers, 1);
            assert.equal(onlineRes3.body.users[0].fullName, 'Jack Sparrow');

            // User Jack goes offline
            await disconnectUserSocket(sockJack);

            const onlineRes4 = await agent.get('/auth/people?tab=online');
            assert.equal(onlineRes4.status, 200);
            assert.equal(onlineRes4.body.totalUsers, 0);
        });
    });
});
