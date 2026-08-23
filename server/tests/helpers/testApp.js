import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import supertest from 'supertest';
import { io as ClientIO } from 'socket.io-client';
import conversationRouter from '../../routes/conversation.js';
import authRouter from '../../routes/auth.js';
import initializeChatSockets from '../../sockets/chatSockets.js';
import mongoose from 'mongoose';

// Whitelist origins from specifications
const ALLOWED_ORIGINS = new Set([
    process.env.CLIENT_URL || 'http://localhost:5174',
    'http://localhost:5174',
    'https://nexus-aryan.vercel.app'
]);

/**
 * Creates an isolated Express test application mirroring production configuration.
 */
export function createTestApp(options = {}) {
    const app = express();
    app.set('trust proxy', 1);

    // CSRF & Origin verification middleware
    app.use((req, res, next) => {
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            // Allow tests to bypass CSRF if explicitly disabled in options
            if (options.disableCsrf) {
                return next();
            }

            const rawOrigin = req.headers.origin || req.headers.referer;
            if (!rawOrigin) {
                return res.status(403).json({ error: true, message: 'Forbidden: Invalid or missing request origin' });
            }

            let parsedOrigin;
            try {
                parsedOrigin = new URL(rawOrigin).origin;
            } catch {
                return res.status(403).json({ error: true, message: 'Forbidden: Malformed request origin' });
            }

            if (!ALLOWED_ORIGINS.has(parsedOrigin)) {
                return res.status(403).json({ error: true, message: 'Forbidden: Invalid request origin' });
            }
        }
        next();
    });

    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || ALLOWED_ORIGINS.has(origin)) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        credentials: true
    }));

    app.use(express.json());
    app.use(cookieParser());

    // In-memory session store for tests
    const sessionMiddleware = session({
        secret: 'test_session_secret_for_unit_and_integration_tests',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    });

    app.use(sessionMiddleware);
    app.use(passport.initialize());
    app.use(passport.session());

    // Test auth injection hook
    app.use((req, res, next) => {
        // If a test user header is provided in test environment
        if (req.headers['x-test-user-id'] && req.headers['x-test-user-name']) {
            req.user = {
                _id: req.headers['x-test-user-id'],
                fullName: req.headers['x-test-user-name'],
                email: req.headers['x-test-user-email'] || `${req.headers['x-test-user-name']}@example.com`,
                picture: req.headers['x-test-user-pic'] || 'https://example.com/pic.png',
                conversations: []
            };
            req.isAuthenticated = () => true;
        }
        next();
    });

    // Health endpoints
    app.get('/health/live', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    app.get('/health/ready', (req, res) => {
        // Allow tests to mock db readyState via options
        const readyState = options.mockDbReadyState !== undefined
            ? options.mockDbReadyState
            : mongoose.connection.readyState;

        if (readyState === 1) {
            res.status(200).json({ status: 'ready', database: 'connected' });
        } else {
            res.status(503).json({ status: 'not_ready', database: 'disconnected' });
        }
    });

    // Routers
    app.use('/auth', authRouter);
    app.use('/conversation', conversationRouter);

    app.get('/', (req, res) => {
        res.send('Hello Live Chat App');
    });

    return app;
}

/**
 * Creates an authenticated Supertest agent representing a specific user.
 */
export function createAuthenticatedAgent(app, user) {
    const agent = supertest.agent(app);
    const userId = user._id ? user._id.toString() : user.toString();
    const userName = user.fullName || 'Test User';
    const userEmail = user.email || `${userName.toLowerCase().replace(/\s+/g, '')}@example.com`;

    // Wrap agent HTTP methods to automatically inject auth and origin headers
    const origGet = agent.get.bind(agent);
    const origPost = agent.post.bind(agent);
    const origPut = agent.put.bind(agent);
    const origDelete = agent.delete.bind(agent);
    const origPatch = agent.patch.bind(agent);

    const applyHeaders = (req) => {
        return req
            .set('Origin', 'http://localhost:5174')
            .set('x-test-user-id', userId)
            .set('x-test-user-name', userName)
            .set('x-test-user-email', userEmail);
    };

    agent.get = (url) => applyHeaders(origGet(url));
    agent.post = (url) => applyHeaders(origPost(url));
    agent.put = (url) => applyHeaders(origPut(url));
    agent.delete = (url) => applyHeaders(origDelete(url));
    agent.patch = (url) => applyHeaders(origPatch(url));

    return agent;
}

/**
 * Creates an unauthenticated Supertest agent with default client origin.
 */
export function createUnauthenticatedAgent(app) {
    const agent = supertest.agent(app);
    const origGet = agent.get.bind(agent);
    const origPost = agent.post.bind(agent);
    const origPut = agent.put.bind(agent);
    const origDelete = agent.delete.bind(agent);
    const origPatch = agent.patch.bind(agent);

    const applyHeaders = (req) => req.set('Origin', 'http://localhost:5174');

    agent.get = (url) => applyHeaders(origGet(url));
    agent.post = (url) => applyHeaders(origPost(url));
    agent.put = (url) => applyHeaders(origPut(url));
    agent.delete = (url) => applyHeaders(origDelete(url));
    agent.patch = (url) => applyHeaders(origPatch(url));

    return agent;
}

/**
 * Creates an ephemeral test Socket.IO server instance.
 */
export async function createTestSocketServer() {
    const app = express();
    const server = createServer(app);
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:5174',
            credentials: true
        }
    });

    // Session middleware wrapper for sockets
    io.use((socket, next) => {
        // Check if handshake contains test session header or auth
        const testUserId = socket.handshake.headers?.['x-test-user-id'] || socket.handshake.auth?.testUserId;
        const testUserName = socket.handshake.headers?.['x-test-user-name'] || socket.handshake.auth?.testUserName;

        if (testUserId) {
            if (socket.request) {
                socket.request.user = {
                    _id: testUserId,
                    fullName: testUserName || 'Test Socket User'
                };
                socket.request.session = {
                    passport: {
                        user: testUserId
                    }
                };
            }
            socket.data = socket.data || {};
            socket.data.userId = testUserId.toString();
            socket.data.user = socket.request?.user || { _id: testUserId, fullName: testUserName };
        }
        next();
    });

    initializeChatSockets(io);

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const serverUrl = `http://127.0.0.1:${port}`;

    const connectClient = (options = {}) => {
        const headers = {};
        const userId = options.user ? (options.user._id ? options.user._id.toString() : options.user.toString()) : undefined;
        if (userId) {
            headers['x-test-user-id'] = userId;
            headers['x-test-user-name'] = options.user.fullName || 'Socket User';
        }

        const clientOptions = {
            extraHeaders: headers,
            auth: {
                testUserId: userId,
                testUserName: options.user?.fullName,
                ...(options.auth || {})
            },
            transports: ['polling', 'websocket'],
            forceNew: true,
            reconnection: false,
            ...options.socketOptions
        };

        return ClientIO(serverUrl, clientOptions);
    };

    const cleanup = async () => {
        return new Promise((resolve) => {
            // Disconnect all active server sockets
            if (io.sockets && io.sockets.sockets) {
                for (const [, socket] of io.sockets.sockets) {
                    socket.disconnect(true);
                }
            }
            io.close(() => {
                server.close(() => {
                    resolve();
                });
            });
        });
    };

    return { server, io, serverUrl, connectClient, cleanup };
}
