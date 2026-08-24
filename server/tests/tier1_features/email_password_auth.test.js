import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import { createTestApp } from '../helpers/testApp.js';
import { setupMockDb, restoreMockDb, resetMockDb } from '../helpers/mockDb.js';

describe('Tier 1: Feature Coverage — Email & Password Authentication (/auth/register & /auth/login)', () => {
    let app;
    let request;

    before(() => {
        setupMockDb();
        app = createTestApp();
        request = supertest(app);
    });

    after(() => {
        restoreMockDb();
    });

    beforeEach(() => {
        resetMockDb();
    });

    describe('POST /auth/register', () => {
        it('1. Successfully registers a user with custom picture and returns sanitized user with session', async () => {
            const payload = {
                fullName: 'Alice Walker',
                email: 'alice@example.com',
                password: 'password123',
                picture: 'https://res.cloudinary.com/test/image/upload/v123/avatar.jpg',
            };

            const res = await request
                .post('/auth/register')
                .set('Origin', 'http://localhost:5174')
                .send(payload);

            assert.equal(res.status, 201);
            assert.equal(res.body.error, false);
            assert.equal(res.body.message, 'Account created successfully');
            assert.ok(res.body.user);
            assert.equal(res.body.user.fullName, 'Alice Walker');
            assert.equal(res.body.user.email, 'alice@example.com');
            assert.equal(res.body.user.picture, payload.picture);
            assert.equal(res.body.user.password, undefined); // Password must NEVER be exposed

            // Verify session cookie was set
            const cookie = res.headers['set-cookie'];
            assert.ok(cookie && cookie.length > 0, 'Session cookie should be set upon registration');
        });

        it('2. Successfully registers a user without picture and assigns generated avatar URL', async () => {
            const payload = {
                fullName: 'Bob Builder',
                email: 'bob@example.com',
                password: 'securePassword99',
            };

            const res = await request
                .post('/auth/register')
                .set('Origin', 'http://localhost:5174')
                .send(payload);

            assert.equal(res.status, 201);
            assert.equal(res.body.error, false);
            assert.equal(res.body.user.fullName, 'Bob Builder');
            assert.equal(res.body.user.email, 'bob@example.com');
            assert.match(res.body.user.picture, /ui-avatars\.com/);
            assert.equal(res.body.user.password, undefined);
        });

        it('3. Rejects registration with missing full name (400 Bad Request)', async () => {
            const res = await request
                .post('/auth/register')
                .set('Origin', 'http://localhost:5174')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            assert.equal(res.status, 400);
            assert.equal(res.body.error, true);
            assert.match(res.body.message, /full name is required/i);
        });

        it('4. Rejects registration with invalid email format (400 Bad Request)', async () => {
            const res = await request
                .post('/auth/register')
                .set('Origin', 'http://localhost:5174')
                .send({
                    fullName: 'Invalid Email User',
                    email: 'not-an-email',
                    password: 'password123',
                });

            assert.equal(res.status, 400);
            assert.equal(res.body.error, true);
            assert.match(res.body.message, /valid email/i);
        });

        it('5. Rejects registration with short password < 6 chars (400 Bad Request)', async () => {
            const res = await request
                .post('/auth/register')
                .set('Origin', 'http://localhost:5174')
                .send({
                    fullName: 'Short Pass User',
                    email: 'short@example.com',
                    password: '12345',
                });

            assert.equal(res.status, 400);
            assert.equal(res.body.error, true);
            assert.match(res.body.message, /at least 6 characters/i);
        });

        it('6. Rejects registration when email already exists with password (409 Conflict)', async () => {
            // First registration
            await request
                .post('/auth/register')
                .set('Origin', 'http://localhost:5174')
                .send({
                    fullName: 'Existing User',
                    email: 'duplicate@example.com',
                    password: 'password123',
                });

            // Duplicate registration attempt
            const res = await request
                .post('/auth/register')
                .set('Origin', 'http://localhost:5174')
                .send({
                    fullName: 'Existing User 2',
                    email: 'duplicate@example.com',
                    password: 'password456',
                });

            assert.equal(res.status, 409);
            assert.equal(res.body.error, true);
            assert.match(res.body.message, /already exists/i);
        });

        it('7. Rejects registration when email exists from OAuth without password (400 Bad Request)', async () => {
            // Seed an OAuth user
            await User.create({
                fullName: 'Google User',
                email: 'oauth@example.com',
                googleId: 'google-uid-12345',
                picture: 'https://google.com/photo.jpg',
            });

            const res = await request
                .post('/auth/register')
                .set('Origin', 'http://localhost:5174')
                .send({
                    fullName: 'Google User',
                    email: 'oauth@example.com',
                    password: 'newpassword123',
                });

            assert.equal(res.status, 400);
            assert.equal(res.body.error, true);
            assert.match(res.body.message, /social/i);
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('secretPassword', salt);
            await User.create({
                fullName: 'Login Tester',
                email: 'login@example.com',
                password: hashedPassword,
                picture: 'https://res.cloudinary.com/test/pic.png',
            });
        });

        it('1. Successfully logs in with valid credentials (200 OK + session cookie)', async () => {
            const res = await request
                .post('/auth/login')
                .set('Origin', 'http://localhost:5174')
                .send({
                    email: 'login@example.com',
                    password: 'secretPassword',
                });

            assert.equal(res.status, 200);
            assert.equal(res.body.error, false);
            assert.equal(res.body.message, 'Logged in successfully');
            assert.ok(res.body.user);
            assert.equal(res.body.user.email, 'login@example.com');
            assert.equal(res.body.user.password, undefined);

            const cookie = res.headers['set-cookie'];
            assert.ok(cookie && cookie.length > 0, 'Session cookie should be set on login');
        });

        it('2. Normalizes email case during login (case-insensitive)', async () => {
            const res = await request
                .post('/auth/login')
                .set('Origin', 'http://localhost:5174')
                .send({
                    email: 'LOGIN@EXAMPLE.COM',
                    password: 'secretPassword',
                });

            assert.equal(res.status, 200);
            assert.equal(res.body.error, false);
            assert.equal(res.body.user.email, 'login@example.com');
        });

        it('3. Rejects login with incorrect password (401 Unauthorized)', async () => {
            const res = await request
                .post('/auth/login')
                .set('Origin', 'http://localhost:5174')
                .send({
                    email: 'login@example.com',
                    password: 'wrongPassword',
                });

            assert.equal(res.status, 401);
            assert.equal(res.body.error, true);
            assert.match(res.body.message, /invalid email or password/i);
        });

        it('4. Rejects login for non-existent email (401 Unauthorized)', async () => {
            const res = await request
                .post('/auth/login')
                .set('Origin', 'http://localhost:5174')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'somePassword',
                });

            assert.equal(res.status, 401);
            assert.equal(res.body.error, true);
            assert.match(res.body.message, /invalid email or password/i);
        });

        it('5. Rejects password login for OAuth user without password (400 Bad Request)', async () => {
            await User.create({
                fullName: 'Facebook User',
                email: 'fb@example.com',
                facebookId: 'fb-uid-999',
            });

            const res = await request
                .post('/auth/login')
                .set('Origin', 'http://localhost:5174')
                .send({
                    email: 'fb@example.com',
                    password: 'somePassword',
                });

            assert.equal(res.status, 400);
            assert.equal(res.body.error, true);
            assert.match(res.body.message, /social|Google or Facebook/i);
        });

        it('6. Rejects login with missing fields (400 Bad Request)', async () => {
            const resNoEmail = await request
                .post('/auth/login')
                .set('Origin', 'http://localhost:5174')
                .send({ password: 'somePassword' });

            assert.equal(resNoEmail.status, 400);
            assert.equal(resNoEmail.body.error, true);

            const resNoPass = await request
                .post('/auth/login')
                .set('Origin', 'http://localhost:5174')
                .send({ email: 'login@example.com' });

            assert.equal(resNoPass.status, 400);
            assert.equal(resNoPass.body.error, true);
        });
    });
});
