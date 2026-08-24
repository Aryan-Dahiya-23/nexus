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
import { getOnlineUserIds } from '../../sockets/chatSockets.js';

describe('Tier 2 Challenger: Empirical Backend Stress, Multi-Tab Presence & Paging Concurrency', () => {
    let app;
    let socketServer;
    let requesterUser;
    let seededUsers = [];
    const activeSockets = [];

    const USER_NAMES = [
        'Aaron Rodgers',
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
        'Steve Jobs',
        'Tom Hanks',
        'Uma Thurman',
        'Victor Hugo',
        'Walt Disney',
        'Xavier Woods',
        'Yoko Ono',
        'Zack Snyder',
        'Special (Parenthesis)',
        'Special [User].*+?',
        'Special $Dollar^Hat',
        'Special {Braces} & |Pipes|',
        'Special \\Backslash & /Slash/',
        'Unicode 🚀 Rocket',
        'Unicode 日本語 Tester',
        'Unicode العربية User',
        'Unicode François Cœur'
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
        while (activeSockets.length > 0) {
            const sock = activeSockets.pop();
            if (sock && sock.connected) {
                sock.close();
            }
        }

        resetMockDb();

        requesterUser = seedUser({
            fullName: 'Primary Requester',
            email: 'primary_requester@nexus.test',
            picture: 'https://nexus.test/avatars/primary.png'
        });

        seededUsers = USER_NAMES.map((name, index) => {
            return seedUser({
                fullName: name,
                email: `seeded_user_${index + 1}@nexus.test`,
                picture: `https://nexus.test/avatars/user_${index + 1}.png`
            });
        });
    });

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
        await new Promise((resolve) => setTimeout(resolve, 25));
        return client;
    };

    const disconnectUserSocket = async (client) => {
        if (client && client.connected) {
            client.close();
            await new Promise((resolve) => setTimeout(resolve, 35));
        }
    };

    // =========================================================================
    // SECTION 1: Adversarial Boundary & Injection Payloads on GET /auth/people
    // =========================================================================
    describe('1. Adversarial Boundary & Injection Payloads', () => {
        it('1.1 Extreme, negative, float, and non-numeric page values clamp safely to page 1', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);

            const testCases = [
                '-999999',
                '0',
                '-1',
                'NaN',
                'Infinity',
                '-Infinity',
                'abc',
                'undefined',
                'null',
                '   1   ',
                '1e2',
                '3.7',
                ''
            ];

            for (const testPage of testCases) {
                const res = await agent.get(`/auth/people?page=${encodeURIComponent(testPage)}&limit=10`);
                assert.equal(res.status, 200, `Failed for page parameter: "${testPage}"`);
                assert.equal(res.body.error, false);
                assert.equal(typeof res.body.currentPage, 'number');
                assert.ok(res.body.currentPage >= 1, `Page was not >= 1 for "${testPage}"`);
                assert.equal(Array.isArray(res.body.users), true);
            }
        });

        it('1.2 Massive out-of-range page numbers return empty array without crashing', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);

            const resHuge = await agent.get('/auth/people?page=9007199254740991&limit=10');
            assert.equal(resHuge.status, 200);
            assert.equal(resHuge.body.error, false);
            assert.equal(resHuge.body.users.length, 0);
            assert.equal(resHuge.body.hasMore, false);
            assert.equal(resHuge.body.totalUsers, seededUsers.length);
        });

        it('1.3 Boundary limit values clamp strictly between 1 and 50', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);

            // Negative limit -> clamps to 1
            const resNeg = await agent.get('/auth/people?limit=-100');
            assert.equal(resNeg.status, 200);
            assert.equal(resNeg.body.users.length, 1);

            // Zero limit -> clamps to 1
            const resZero = await agent.get('/auth/people?limit=0');
            assert.equal(resZero.status, 200);
            assert.equal(resZero.body.users.length, 1);

            // Limit = 1
            const resOne = await agent.get('/auth/people?limit=1');
            assert.equal(resOne.status, 200);
            assert.equal(resOne.body.users.length, 1);

            // Limit = 50 -> returns up to 50 users (we have 43 seeded users)
            const res50 = await agent.get('/auth/people?limit=50');
            assert.equal(res50.status, 200);
            assert.equal(res50.body.users.length, seededUsers.length);

            // Limit = 51 -> clamps to 50
            const res51 = await agent.get('/auth/people?limit=51');
            assert.equal(res51.status, 200);
            assert.equal(res51.body.users.length, seededUsers.length);

            // Limit = 999999 -> clamps to 50
            const resHugeLimit = await agent.get('/auth/people?limit=999999');
            assert.equal(resHugeLimit.status, 200);
            assert.equal(resHugeLimit.body.users.length, seededUsers.length);

            // Non-numeric limit defaults to 20
            const resInvalid = await agent.get('/auth/people?limit=xyz');
            assert.equal(resInvalid.status, 200);
            assert.equal(resInvalid.body.users.length, 20);
        });

        it('1.4 ReDoS & Catastrophic Backtracking payloads are sanitized to literal searches and execute instantly', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);

            const redosPayloads = [
                '(a+)+$',
                '(a|aa)+$',
                '(a|a?)+$',
                '((a+)+)+$',
                '(x+x+)+y',
                'a'.repeat(50) + '!',
                '(.*a){10}',
                '([a-zA-Z0-9_]+)*$',
                '(([a-z])+.)+[A-Z]([a-z])+'
            ];

            for (const payload of redosPayloads) {
                const startTime = Date.now();
                const res = await agent.get(`/auth/people?search=${encodeURIComponent(payload)}`);
                const elapsedMs = Date.now() - startTime;

                assert.equal(res.status, 200, `Failed on ReDoS payload: ${payload}`);
                assert.equal(res.body.error, false);
                assert.ok(elapsedMs < 100, `ReDoS payload took too long (${elapsedMs}ms): ${payload}`);
                // Since no user has literal string "(a+)+$", it should return 0 users safely
                assert.equal(res.body.users.length, 0);
            }
        });

        it('1.5 Regex metacharacters and character classes are treated strictly as literal substrings', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);

            // 1. Search for literal bracket pattern "[User]"
            const resBracket = await agent.get('/auth/people?search=%5BUser%5D');
            assert.equal(resBracket.status, 200);
            assert.equal(resBracket.body.users.length, 1);
            assert.equal(resBracket.body.users[0].fullName, 'Special [User].*+?');

            // 2. Search for literal parenthesis "(Parenthesis)"
            const resParen = await agent.get('/auth/people?search=(Parenthesis)');
            assert.equal(resParen.status, 200);
            assert.equal(resParen.body.users.length, 1);
            assert.equal(resParen.body.users[0].fullName, 'Special (Parenthesis)');

            // 3. Search for literal "$Dollar^Hat"
            const resDollar = await agent.get('/auth/people?search=$Dollar^Hat');
            assert.equal(resDollar.status, 200);
            assert.equal(resDollar.body.users.length, 1);
            assert.equal(resDollar.body.users[0].fullName, 'Special $Dollar^Hat');

            // 4. Search for literal "{Braces}"
            const resBraces = await agent.get('/auth/people?search={Braces}');
            assert.equal(resBraces.status, 200);
            assert.equal(resBraces.body.users.length, 1);
            assert.equal(resBraces.body.users[0].fullName, 'Special {Braces} & |Pipes|');

            // 5. Search for regex tokens like `.*+?` -> matches ONLY "Special [User].*+?"
            const resDotStar = await agent.get(`/auth/people?search=${encodeURIComponent('.*+?')}`);
            assert.equal(resDotStar.status, 200);
            assert.equal(resDotStar.body.users.length, 1);
            assert.equal(resDotStar.body.users[0].fullName, 'Special [User].*+?');
        });

        it('1.6 Unicode, Emoji, and International character search queries match correctly', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);

            // Emoji search
            const resEmoji = await agent.get(`/auth/people?search=${encodeURIComponent('🚀')}`);
            assert.equal(resEmoji.status, 200);
            assert.equal(resEmoji.body.users.length, 1);
            assert.equal(resEmoji.body.users[0].fullName, 'Unicode 🚀 Rocket');

            // Japanese search
            const resJapanese = await agent.get(`/auth/people?search=${encodeURIComponent('日本語')}`);
            assert.equal(resJapanese.status, 200);
            assert.equal(resJapanese.body.users.length, 1);
            assert.equal(resJapanese.body.users[0].fullName, 'Unicode 日本語 Tester');

            // Arabic search
            const resArabic = await agent.get(`/auth/people?search=${encodeURIComponent('العربية')}`);
            assert.equal(resArabic.status, 200);
            assert.equal(resArabic.body.users.length, 1);
            assert.equal(resArabic.body.users[0].fullName, 'Unicode العربية User');

            // Accented French search
            const resFrench = await agent.get(`/auth/people?search=${encodeURIComponent('François')}`);
            assert.equal(resFrench.status, 200);
            assert.equal(resFrench.body.users.length, 1);
            assert.equal(resFrench.body.users[0].fullName, 'Unicode François Cœur');
        });

        it('1.7 Null byte and massive query strings do not crash the service', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);

            // Null byte search
            const resNull = await agent.get('/auth/people?search=%00');
            assert.equal(resNull.status, 200);
            assert.equal(resNull.body.error, false);

            // Massive search string (5,000 characters)
            const hugeQuery = 'A'.repeat(5000);
            const resHuge = await agent.get(`/auth/people?search=${hugeQuery}`);
            assert.equal(resHuge.status, 200);
            assert.equal(resHuge.body.error, false);
            assert.equal(resHuge.body.users.length, 0);
        });

        it('1.8 Malformed object query parameters / NoSQL injection attempts fail gracefully', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);

            // Attempting object queries like ?search[$ne]=null or ?page[$gt]=0
            const resSearchInj = await agent.get('/auth/people?search[$regex]=.*');
            assert.equal(resSearchInj.status, 200);
            assert.equal(resSearchInj.body.error, false);

            const resPageInj = await agent.get('/auth/people?page[$gt]=0');
            assert.equal(resPageInj.status, 200);
            assert.equal(resPageInj.body.error, false);
            assert.equal(resPageInj.body.currentPage, 1);
        });

        it('1.9 Invalid or unexpected tab parameter values default to "all"', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);

            const invalidTabs = ['ONLINE', 'unknown', '123', 'true', '', 'null'];
            for (const t of invalidTabs) {
                const res = await agent.get(`/auth/people?tab=${encodeURIComponent(t)}&limit=50`);
                assert.equal(res.status, 200);
                // All 43 seeded users should be returned
                assert.equal(res.body.totalUsers, seededUsers.length);
            }
        });
    });

    // =========================================================================
    // SECTION 2: Multi-Tab Presence Transitions & Real-Time Integrity
    // =========================================================================
    describe('2. Multi-Tab Presence Transitions & Real-Time Integrity', () => {
        it('2.1 Multi-tab lifecycle: User with 3 open tabs remains online until the LAST tab is closed', async () => {
            const targetUser = seededUsers.find((u) => u.fullName === 'Steve Jobs');
            const agent = createAuthenticatedAgent(app, requesterUser);

            // Initial: targetUser is offline
            let res = await agent.get('/auth/people?tab=online');
            assert.equal(res.status, 200);
            assert.equal(res.body.totalUsers, 0);

            // Tab 1 opens
            const tab1 = await connectUserSocket(targetUser);
            res = await agent.get('/auth/people?tab=online');
            assert.equal(res.body.totalUsers, 1);
            assert.equal(res.body.users[0].fullName, 'Steve Jobs');

            // Tab 2 opens (same user, 2nd socket)
            const tab2 = await connectUserSocket(targetUser);
            res = await agent.get('/auth/people?tab=online');
            assert.equal(res.body.totalUsers, 1, 'User must appear exactly once even with 2 tabs');
            assert.equal(getOnlineUserIds().filter((id) => id === targetUser._id.toString()).length, 1);

            // Tab 3 opens (same user, 3rd socket)
            const tab3 = await connectUserSocket(targetUser);
            res = await agent.get('/auth/people?tab=online');
            assert.equal(res.body.totalUsers, 1, 'User must appear exactly once even with 3 tabs');

            // Close Tab 1 -> User still has Tab 2 and Tab 3
            await disconnectUserSocket(tab1);
            res = await agent.get('/auth/people?tab=online');
            assert.equal(res.body.totalUsers, 1, 'User must remain online after closing tab 1 of 3');
            assert.equal(res.body.users[0].fullName, 'Steve Jobs');

            // Close Tab 2 -> User still has Tab 3
            await disconnectUserSocket(tab2);
            res = await agent.get('/auth/people?tab=online');
            assert.equal(res.body.totalUsers, 1, 'User must remain online after closing tab 2 of 3');
            assert.equal(res.body.users[0].fullName, 'Steve Jobs');

            // Close Tab 3 -> User has 0 active tabs -> MUST BE OFFLINE
            await disconnectUserSocket(tab3);
            res = await agent.get('/auth/people?tab=online');
            assert.equal(res.body.totalUsers, 0, 'User must become offline after closing the final tab');
            assert.equal(res.body.users.length, 0);

            // Re-open Tab 1 -> User comes back online cleanly
            const tabReopen = await connectUserSocket(targetUser);
            res = await agent.get('/auth/people?tab=online');
            assert.equal(res.body.totalUsers, 1);
            assert.equal(res.body.users[0].fullName, 'Steve Jobs');

            await disconnectUserSocket(tabReopen);
        });

        it('2.2 High-churn presence storm: 8 users concurrently opening and closing varying numbers of tabs', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);
            const churnUsers = seededUsers.slice(0, 8);
            const userTabsMap = new Map();

            // Open 1 to 3 tabs per user
            for (let i = 0; i < churnUsers.length; i++) {
                const user = churnUsers[i];
                const tabCount = (i % 3) + 1; // 1, 2, or 3 tabs
                const sockets = [];
                for (let t = 0; t < tabCount; t++) {
                    const sock = await connectUserSocket(user);
                    sockets.push(sock);
                }
                userTabsMap.set(user._id.toString(), { user, sockets });
            }

            // Verify all 8 users are online and unique
            let onlineRes = await agent.get('/auth/people?tab=online&limit=50');
            assert.equal(onlineRes.body.totalUsers, 8);
            const returnedIds = onlineRes.body.users.map((u) => u._id.toString());
            assert.equal(new Set(returnedIds).size, 8);

            // Partially close 1 tab from users that have > 1 tab
            for (const [, entry] of userTabsMap) {
                if (entry.sockets.length > 1) {
                    const closedSock = entry.sockets.pop();
                    await disconnectUserSocket(closedSock);
                }
            }

            // All 8 users must still be online because each still has >= 1 active socket
            onlineRes = await agent.get('/auth/people?tab=online&limit=50');
            assert.equal(onlineRes.body.totalUsers, 8, 'All users must remain online after closing partial tabs');

            // Now close ALL sockets for the first 4 users
            for (let i = 0; i < 4; i++) {
                const userId = churnUsers[i]._id.toString();
                const entry = userTabsMap.get(userId);
                while (entry.sockets.length > 0) {
                    const s = entry.sockets.pop();
                    await disconnectUserSocket(s);
                }
            }

            // Exactly 4 users must now be online
            onlineRes = await agent.get('/auth/people?tab=online&limit=50');
            assert.equal(onlineRes.body.totalUsers, 4);
            const remainingNames = onlineRes.body.users.map((u) => u.fullName).sort();
            const expectedNames = churnUsers.slice(4, 8).map((u) => u.fullName).sort();
            assert.deepEqual(remainingNames, expectedNames);

            // Close all remaining sockets
            for (let i = 4; i < 8; i++) {
                const userId = churnUsers[i]._id.toString();
                const entry = userTabsMap.get(userId);
                while (entry.sockets.length > 0) {
                    const s = entry.sockets.pop();
                    await disconnectUserSocket(s);
                }
            }

            // All offline
            onlineRes = await agent.get('/auth/people?tab=online&limit=50');
            assert.equal(onlineRes.body.totalUsers, 0);
        });

        it('2.3 Requester user with multiple active tabs is strictly excluded from tab=all and tab=online', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);

            // Requester opens 3 tabs
            const reqTab1 = await connectUserSocket(requesterUser);
            const reqTab2 = await connectUserSocket(requesterUser);
            const reqTab3 = await connectUserSocket(requesterUser);

            // Another user opens 1 tab
            const bobUser = seededUsers.find((u) => u.fullName === 'Bob Marley');
            const bobTab = await connectUserSocket(bobUser);

            // tab=all check
            const allRes = await agent.get('/auth/people?limit=50');
            assert.equal(allRes.body.totalUsers, seededUsers.length);
            assert.equal(allRes.body.users.some((u) => u._id.toString() === requesterUser._id.toString()), false);

            // tab=online check
            const onlineRes = await agent.get('/auth/people?tab=online');
            assert.equal(onlineRes.body.totalUsers, 1);
            assert.equal(onlineRes.body.users[0].fullName, 'Bob Marley');
            assert.equal(onlineRes.body.users.some((u) => u._id.toString() === requesterUser._id.toString()), false);

            await disconnectUserSocket(reqTab1);
            await disconnectUserSocket(reqTab2);
            await disconnectUserSocket(reqTab3);
            await disconnectUserSocket(bobTab);
        });
    });

    // =========================================================================
    // SECTION 3: Concurrency, Pagination Slicing & Traversal Consistency
    // =========================================================================
    describe('3. Concurrency, Pagination Slicing & Traversal Consistency', () => {
        it('3.1 Concurrent requests across all pages return disjoint subsets with 0 duplicate IDs', async () => {
            const LIMIT = 5;
            const totalExpectedUsers = seededUsers.length; // 43
            const totalExpectedPages = Math.ceil(totalExpectedUsers / LIMIT); // 9

            // Fire all 9 page requests concurrently with independent agent instances
            const pagePromises = [];
            for (let page = 1; page <= totalExpectedPages; page++) {
                const individualAgent = createAuthenticatedAgent(app, requesterUser);
                pagePromises.push(individualAgent.get(`/auth/people?page=${page}&limit=${LIMIT}`));
            }

            const responses = await Promise.all(pagePromises);

            const allCollectedUsers = [];
            for (let i = 0; i < responses.length; i++) {
                const res = responses[i];
                assert.equal(res.status, 200);
                assert.equal(res.body.error, false);
                assert.equal(res.body.currentPage, i + 1);
                assert.equal(res.body.totalUsers, totalExpectedUsers);
                assert.equal(res.body.totalPages, totalExpectedPages);

                if (i + 1 < totalExpectedPages) {
                    assert.equal(res.body.users.length, LIMIT);
                    assert.equal(res.body.hasMore, true);
                } else {
                    // Last page remainder
                    const remainder = totalExpectedUsers % LIMIT || LIMIT;
                    assert.equal(res.body.users.length, remainder);
                    assert.equal(res.body.hasMore, false);
                }

                allCollectedUsers.push(...res.body.users);
            }

            // Verify total count matches exactly
            assert.equal(allCollectedUsers.length, totalExpectedUsers);

            // Verify 0 duplicate IDs
            const collectedIds = allCollectedUsers.map((u) => u._id.toString());
            const uniqueIds = new Set(collectedIds);
            assert.equal(uniqueIds.size, totalExpectedUsers, 'Duplicate user IDs found across concurrent pages!');

            // Verify strict alphabetical order across all collected users
            for (let i = 1; i < allCollectedUsers.length; i++) {
                const prev = allCollectedUsers[i - 1].fullName;
                const curr = allCollectedUsers[i].fullName;
                assert.ok(prev.localeCompare(curr) <= 0, `Ordering violation: "${prev}" before "${curr}"`);
            }
        });

        it('3.2 Sequential traversal with arbitrary limit sizes (3, 7, 13, 23) reconstructs full dataset perfectly', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);
            const testLimits = [3, 7, 13, 23];

            for (const limit of testLimits) {
                let page = 1;
                let hasMore = true;
                const collected = [];

                while (hasMore) {
                    const res = await agent.get(`/auth/people?page=${page}&limit=${limit}`);
                    assert.equal(res.status, 200);
                    assert.equal(res.body.error, false);
                    assert.equal(res.body.currentPage, page);

                    collected.push(...res.body.users);
                    hasMore = res.body.hasMore;
                    page++;

                    if (page > 30) {
                        assert.fail(`Infinite pagination loop detected for limit=${limit}`);
                    }
                }

                assert.equal(collected.length, seededUsers.length, `Mismatch in total collected users for limit=${limit}`);
                const uniqueIds = new Set(collected.map((u) => u._id.toString()));
                assert.equal(uniqueIds.size, seededUsers.length, `Duplicates detected in traversal for limit=${limit}`);
            }
        });

        it('3.3 Search query pagination traversal returns all matching items without duplicates', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);

            // Search for "Alice" (3 Alice users: Adams, Cooper, Walker)
            let page = 1;
            let hasMore = true;
            const collectedAlice = [];

            while (hasMore) {
                const res = await agent.get(`/auth/people?search=alice&page=${page}&limit=2`);
                assert.equal(res.status, 200);
                assert.equal(res.body.totalUsers, 3);
                assert.equal(res.body.totalPages, 2);

                collectedAlice.push(...res.body.users);
                hasMore = res.body.hasMore;
                page++;
            }

            assert.equal(collectedAlice.length, 3);
            const aliceNames = collectedAlice.map((u) => u.fullName);
            assert.deepEqual(aliceNames, ['Alice Adams', 'Alice Cooper', 'Alice Walker']);
        });

        it('3.4 Online tab pagination traversal across multiple online users', async () => {
            const agent = createAuthenticatedAgent(app, requesterUser);
            const onlineGroup = seededUsers.slice(0, 15);

            const connectedSockets = [];
            for (const user of onlineGroup) {
                const s = await connectUserSocket(user);
                connectedSockets.push(s);
            }

            let page = 1;
            let hasMore = true;
            const collectedOnline = [];

            while (hasMore) {
                const res = await agent.get(`/auth/people?tab=online&page=${page}&limit=4`);
                assert.equal(res.status, 200);
                assert.equal(res.body.totalUsers, 15);
                assert.equal(res.body.totalPages, 4);

                collectedOnline.push(...res.body.users);
                hasMore = res.body.hasMore;
                page++;
            }

            assert.equal(collectedOnline.length, 15);
            const uniqueOnlineIds = new Set(collectedOnline.map((u) => u._id.toString()));
            assert.equal(uniqueOnlineIds.size, 15);

            for (const s of connectedSockets) {
                await disconnectUserSocket(s);
            }
        });
    });
});
