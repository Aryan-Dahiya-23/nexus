# Nexus Security & Production Remediation Plan

This document outlines the concrete security gaps, architecture defects, and code quality tasks identified during independent review. Tasks are categorized by priority and must be systematically resolved before final production deployment.

---

## 🚨 Tier 1 — Critical Security Fixes (Immediate)

### 1. Scrub Secrets from Documentation & Rotate Credentials
* **Files:** [`README.md`](file:///Users/aryandahiya/Desktop/Programming/nexus/README.md)
* **Problem:** Real ZEGOCLOUD App Credentials (`ZEGO_APP_ID`, `ZEGO_SERVER_SECRET`) and Cloudinary identifiers were committed in the documentation example table.
* **Action Required:**
  - [x] Replace all production secrets in `README.md` with dummy placeholders (`your_zego_server_secret`, `your_cloud_name`).
  - [x] Rotate the ZEGOCLOUD server secret in the ZEGOCLOUD admin console.
  - [x] Verify unsigned upload preset restrictions in the Cloudinary console.

---

### 2. Strict Socket.IO Session Authentication & Impersonation Prevention
* **Files:** [`server/sockets/chatSockets.js`](file:///Users/aryandahiya/Desktop/Programming/nexus/server/sockets/chatSockets.js)
* **Problem:** 
  - The Socket.IO middleware calls `next()` unconditionally, allowing unauthenticated connections.
  - The server falls back to `socket.handshake.auth.userId` or the client-emitted `user connected` event to determine user identity.
  - An attacker can connect without credentials, claim any user ID, and receive that user's private messages or call events.
* **Action Required:**
  - [x] In `io.use()`, reject connections if `!socket.request.session?.passport?.user` with `next(new Error("Authentication error: No active session"))`.
  - [x] Derive `socket.userId = socket.request.session.passport.user` exclusively from the session.
  - [x] Remove all fallback handling for `socket.handshake.auth.userId` and the `user connected` event.
  - [x] Enforce conversation membership checks before allowing sockets to join `conversation:${conversationId}` rooms.

---

### 3. Authorize ZEGOCLOUD Room Token Issuance (IDOR Defense)
* **Files:** [`server/controllers/conversationController.js`](file:///Users/aryandahiya/Desktop/Programming/nexus/server/controllers/conversationController.js)
* **Problem:** `getZegoToken` issues a valid RTC token for any arbitrary `roomId` provided in the route parameters without checking if the calling user belongs to that conversation.
* **Action Required:**
  - [x] Look up the `Conversation` by `roomId`.
  - [x] Verify that `req.user._id` exists within `conversation.participants`. Return `403 Forbidden` if unauthorized.
  - [x] Disallow generating tokens for arbitrary unverified room IDs.

---

### 4. Robust Request Origin & CSRF Defense
* **Files:** [`server/index.js`](file:///Users/aryandahiya/Desktop/Programming/nexus/server/index.js)
* **Problem:** 
  - The middleware uses `.startsWith()` to validate origins, allowing attacker domains like `https://nexus-aryan.vercel.app.attacker.com`.
  - Requests missing `Origin` and `Referer` headers are permitted through to mutating endpoints (`POST`, `PUT`, `DELETE`).
* **Action Required:**
  - [x] Parse `req.headers.origin || req.headers.referer` with `new URL()` to extract the exact origin scheme and hostname.
  - [x] Perform strict equality (`===`) against the whitelist (`process.env.CLIENT_URL`, `http://localhost:5174`, `https://nexus-aryan.vercel.app`).
  - [x] Reject mutating state requests (`POST`, `PUT`, `DELETE`, `PATCH`) with `403 Forbidden` if the origin header is missing or unverified in production.

---

## 🛠️ Tier 2 — Code Quality, Strictness & Frontend Cleanup

### 5. Enable Strict TypeScript Compilation
* **Files:** [`client/tsconfig.json`](file:///Users/aryandahiya/Desktop/Programming/nexus/client/tsconfig.json)
* **Problem:** `noImplicitAny` is currently set to `false`, allowing untyped `any` references to hide runtime failures.
* **Action Required:**
  - [x] Set `"noImplicitAny": true` in `client/tsconfig.json`.
  - [x] Resolve all remaining `any` types across components, API clients, and context providers.

---

### 6. Fix Frontend Syntax, CSS & Format Issues
* **Files:** [`client/src/components/Chats/Chats.tsx`](file:///Users/aryandahiya/Desktop/Programming/nexus/client/src/components/Chats/Chats.tsx)
* **Problem:**
  - Erroneous leading backtick in `Chats.tsx` className (`className="`flex flex-col..."`).
  - Trailing CRLF line endings in new files.
* **Action Required:**
  - [x] Fix the className string in `Chats.tsx`.
  - [x] Run `git diff --check` and normalize all files to standard LF line endings.

---

### 7. Configure ESLint & Automated Code Linting
* **Files:** `client/package.json`, `client/.eslintrc.cjs`
* **Problem:** `npm run lint` fails in the client workspace because the ESLint configuration is missing or misconfigured.
* **Action Required:**
  - [x] Set up a clean, modern ESLint + TypeScript configuration.
  - [x] Ensure `npm run lint` passes with zero errors.

---

## 🧪 Tier 3 — Automated Testing & CI Release Gate

### 8. Backend Automated Integration Test Suite
* **Files:** `server/tests/`
* **Problem:** `npm test` only runs `node --check` syntax validation and does not verify business logic, security guards, or error handling.
* **Action Required:**
  - [x] Add automated test runner (`node:test` + supertest equivalent lightweight test runner).
  - [x] Add tests for:
    - Unauthenticated access to `/conversation` endpoints returns `401 Unauthorized`.
    - IDOR protection: User A cannot read or write to User B's conversation (`403 Forbidden`).
    - Health checks: `GET /health/live` and `GET /health/ready`.
    - Socket.IO connection rejection for requests lacking session cookies.

---

### 9. Upgraded CI/CD Release Pipeline
* **Files:** [`.github/workflows/ci.yml`](file:///Users/aryandahiya/Desktop/Programming/nexus/.github/workflows/ci.yml)
* **Problem:** CI only builds the code; it does not enforce linting, automated test suites, or security audits.
* **Action Required:**
  - [x] Add `npm run lint` step.
  - [x] Add `npm test` execution running real integration tests.

---

## 📦 Tier 4 — Data Integrity & Media Workflows

### 10. Group Creation Participant Validation & Atomic Writes
* **Files:** [`server/controllers/conversationController.js`](file:///Users/aryandahiya/Desktop/Programming/nexus/server/controllers/conversationController.js)
* **Problem:** Group creation does not verify that all supplied user IDs actually exist in the database before creating the conversation.
* **Action Required:**
  - [x] Verify `User.countDocuments({ _id: { $in: participantIds } }) === participantIds.length`.
  - [x] Reject requests containing invalid or non-existent participant IDs.

---

### 11. Read Receipts Logic Normalization
* **Files:** [`server/controllers/conversationController.js`](file:///Users/aryandahiya/Desktop/Programming/nexus/server/controllers/conversationController.js), [`client/src/components/Chats/Chats.tsx`](file:///Users/aryandahiya/Desktop/Programming/nexus/client/src/components/Chats/Chats.tsx)
* **Problem:** Currently only the single last message is marked as seen, and the sender is included in `seenBy` to satisfy UI count heuristics.
* **Action Required:**
  - [ ] Mark all unread messages in the conversation for the current reader using `Message.updateMany({ _id: { $in: msgIds }, seenBy: { $ne: req.user._id } }, { $addToSet: { seenBy: req.user._id } })`.
  - [ ] Derive "read by all" purely from non-sender participants.

---

### 12. Cloudinary Signed Upload Workflow
* **Files:** [`server/controllers/conversationController.js`](file:///Users/aryandahiya/Desktop/Programming/nexus/server/controllers/conversationController.js), [`client/src/components/Widgets/CloudinaryUploadWidget.tsx`](file:///Users/aryandahiya/Desktop/Programming/nexus/client/src/components/Widgets/CloudinaryUploadWidget.tsx)
* **Problem:** Client uses an unsigned upload preset.
* **Action Required:**
  - [ ] Provide a backend signature endpoint `POST /conversation/cloudinary-signature` using the Cloudinary API secret so uploads are authenticated.

---

## 📊 Summary Execution Roadmap

```
┌────────────────────────────────────────────────────────┐
│  Tier 1: Critical Security (Secrets, Sockets, CSRF)    │ ◀── START HERE
├────────────────────────────────────────────────────────┤
│  Tier 2: Code Quality (TypeScript, ESLint, CSS)        │
├────────────────────────────────────────────────────────┤
│  Tier 3: Automated Tests & CI Release Gate             │
├────────────────────────────────────────────────────────┤
│  Tier 4: Read Receipts & Cloudinary Signatures         │
└────────────────────────────────────────────────────────┘
```
