# Nexus Production-Readiness Audit and Remediation Plan

Audited: 2026-08-23
Scope: `client/`, `server/`, dependency lockfiles, local/deployment configuration, REST API, Socket.IO, OAuth/session flow, MongoDB models, media/video flows, build/lint/test/CI readiness.

## Executive verdict

**Status: not production ready. Do not expose the current API or Socket.IO server to untrusted users.**

The repository is already separated at the source level:

- `client/` is a Vite + React + TypeScript application.
- `server/` is an Express + Socket.IO + Mongoose application.

Keep those boundaries. Splitting them into separate Git repositories is not currently useful; add root-level orchestration, documentation, and CI after the security foundations are fixed.

The original Gemini audit was directionally good and correctly identified the unauthenticated conversation API, object-level authorization failures, global socket broadcasts, exposed ZEGOCLOUD secret, cache bug, unbounded conversation documents, and several UI bugs. It was not complete enough for a production plan, and a few conclusions or proposed fixes were inaccurate:

- Adding Socket.IO rooms alone is **not** a safe fix. Sockets must first be authenticated using the same server-side identity as HTTP, and every room join/event must be authorized from database membership.
- `.env` files are not tracked in the current tree, and `git log --all -- '**/.env'` found no `.env` paths. There is no repository evidence for the claim that all secrets were pushed to GitHub. The new `.gitignore` remains necessary. Secrets already embedded in a deployed frontend, especially the ZEGOCLOUD server secret, must still be rotated.
- The Facebook Passport callback mismatch does not “work by accident”; its arguments are shifted and the strategy is broken.
- Multiple client socket connections waste resources and corrupt presence, but they do not automatically register the same chat handler six times because most connections are created by different modules.
- `Shift+Enter` and context-render performance are quality issues, not release-blocking security issues.
- Database indexes are safe only after profiling and data checks. A unique email index can fail if duplicates already exist and needs a migration.

## Evidence from this review

| Check | Result |
|---|---|
| Frontend production build | Passes, but emits CSS nesting and extensive dependency `eval` warnings |
| Frontend bundle | Main JS: **7,571.52 kB minified / 1,671.01 kB gzip**; ringtone: 915.33 kB |
| Frontend lint | Fails before linting: no ESLint configuration file |
| Backend syntax | All repository-owned `.js` files pass `node --check` |
| Backend tests | Fails intentionally: `Error: no test specified` |
| Frontend tests | No test script or tests |
| Dependency audit: client | **29 vulnerabilities:** 2 critical, 19 high, 8 moderate |
| Dependency audit: server | **25 vulnerabilities:** 1 critical, 14 high, 3 moderate, 7 low |
| Direct vulnerable packages | Client includes Axios, React Router DOM, PostCSS, Vite; server includes Mongoose, Express, Socket.IO, body-parser |
| CI/CD | No CI workflow, deployment runbook, or release gates |
| Operations | No health/readiness endpoints, graceful shutdown, structured logging, metrics, or error reporting |
| Secret tracking | No tracked `.env` and no `.env` path found in Git history |

## Severity and status

- **P0 / Critical:** exploitable confidentiality/integrity issue or known critical dependency exposure; release blocker.
- **P1 / High:** major security, data, reliability, or production-operability issue; release blocker.
- **P2 / Medium:** important correctness, performance, or maintainability issue; normally fix before general availability.
- **P3 / Low:** polish or developer-experience improvement.
- `[ ]` open, `[x]` completed, `[~]` partially addressed or needs external verification.

---

## P0 — Critical release blockers

### P0-01 — REST API has no authentication or object-level authorization

- **Status:** `[x]`
- **Evidence:** `server/routes/conversation.js`, `server/controllers/conversationController.js`
- Every conversation route is public. Controllers accept `senderId`, `userId`, participant IDs, and conversation IDs from the client. An attacker can read a private conversation, impersonate a sender, create arbitrary groups, mark another user's messages as read, or remove a conversation from another user's account.
- **Required change:** mount an `ensureAuthenticated` middleware on all private routes; derive the actor only from `req.user._id`; load the target conversation and require membership before every read/write; authorize requested group participants; return 401 for no session, 403 for a non-member, and 404 only where resource disclosure is acceptable.
- **Verification:** integration tests must cover unauthenticated access and authenticated non-member access for every endpoint, including malformed ObjectIds.

### P0-02 — Socket.IO is unauthenticated, impersonable, and globally broadcasts private events

- **Status:** `[x]`
- **Evidence:** `server/sockets/chatSockets.js`, all client modules calling `io(...)`
- Any socket can claim any `userId`. Messages, read receipts, new-conversation notices, presence IDs, and call metadata are broadcast with `io.emit()`. The frontend filtering is not an access-control boundary.
- **Required change:** share the Express session middleware with Socket.IO; reject handshakes without a valid user; set `socket.data.userId` from the session, never an event argument; join a private user room plus only database-authorized conversation rooms; validate each event payload and membership; emit server-created canonical records, not client-supplied message objects; add acknowledgement/error responses and per-socket rate/size limits.
- **Verification:** a non-member socket cannot join, receive, emit to, call, or mark read in another conversation. A client cannot impersonate another user by changing an event payload.

### P0-03 — ZEGOCLOUD server secret and test-token generation are shipped to browsers

- **Status:** `[x]`
- **Evidence:** `client/src/components/Room/Room.tsx`, `client/.env.example`
- `VITE_ZEGOCLOUD_SERVER_SECRET` is bundled into public JavaScript and used by `generateKitTokenForTest`. The hardcoded app ID plus secret lets clients mint their own identities/tokens and abuse the project.
- **Required change:** rotate the exposed ZEGOCLOUD secret; delete it from every `VITE_` variable and client artifact; implement an authenticated backend token endpoint that authorizes conversation/call membership and generates short-lived production tokens using the provider's server SDK; never use `generateKitTokenForTest` in production.
- **Verification:** search the built `dist/` for the old secret; attempt token issuance unauthenticated and as a non-member; verify expiry and room/user binding.

### P0-04 — Lockfiles contain known critical and high vulnerabilities

- **Status:** `[ ]`
- **Evidence:** `client/package-lock.json`, `server/package-lock.json`; `npm audit --json` run 2026-08-23
- Client: 29 findings (2 critical, 19 high). Server: 25 findings (1 critical, 14 high). The server's direct Mongoose version is in critical search/prototype-pollution advisory ranges; direct Express and Socket.IO versions also have high findings.
- **Required change:** upgrade direct dependencies intentionally, regenerate lockfiles with the current supported Node/npm toolchain, remove unused packages, run tests after each dependency family upgrade, and document any remaining accepted transitive risk. Do not use `npm audit fix --force` blindly.
- **Verification:** production-only audit has zero critical/high findings, or every exception has a written exploitability assessment, owner, and deadline.

### P0-05 — `/auth/people` is public and returns full user documents

- **Status:** `[x]`
- **Evidence:** `server/routes/auth.js`, `server/controllers/authController.js#people`
- The endpoint trusts `req.query.userId`, requires no session, and calls `User.find(...)` without a projection. It can expose email addresses, provider IDs, conversation references, creation dates, and any legacy password value to anyone.
- **Required change:** require authentication, exclude `req.user._id` server-side, return a deliberate public profile DTO (`_id`, display name, picture only), paginate/search it, and apply abuse controls. Remove the unused `password` field from new writes and explicitly exclude it from queries while legacy data is assessed.
- **Verification:** response contract tests prove private fields never serialize.

---

## P1 — Backend, identity, and API blockers

### P1-01 — Production sessions use Express MemoryStore

- **Status:** `[x]`
- **Evidence:** `server/index.js`; `connect-mongo` is installed but unused
- MemoryStore leaks memory, loses every login on restart, and cannot support multiple instances. Socket authentication also needs access to the same session store.
- **Required change:** configure a durable shared store (MongoStore or Redis), set a stable cookie name, rotate-capable secrets, TTL cleanup, and session regeneration after OAuth login. Use the same middleware for Express and Socket.IO.

### P1-02 — Cross-origin cookie behavior is incomplete and will break after API auth is added

- **Status:** `[x]`
- **Evidence:** `client/src/api/conversation.ts`, `client/src/api/auth.ts`, client `io(...)` calls
- Only verify/logout set Axios `withCredentials`; all conversation and people calls omit it. A Vercel frontend calling a different-site backend will not send the session cookie, so correctly protected endpoints will fail. Socket clients also lack explicit credential/session configuration.
- **Required change:** create one Axios instance with `baseURL`, `withCredentials: true`, timeout, response/error normalization, and CSRF support; create one shared Socket.IO client with the required credential option and controlled connection lifecycle.

### P1-03 — Cookie/proxy/Passport middleware configuration is unsafe and misordered

- **Status:** `[x]`
- **Evidence:** `server/index.js`
- `trust proxy` is enabled after the session middleware; `httpOnly` becomes false in development; `sameSite` is set to boolean `false` in development; `passport.authenticate('session')` runs before `passport.initialize()` and duplicates `passport.session()`.
- **Required change:** validate the deployment proxy count and set trust proxy before session; always use `httpOnly: true`; explicitly choose `sameSite: 'lax'` for same-site deployments or `sameSite: 'none', secure: true` for a cross-site frontend; use `passport.initialize()` then `passport.session()`; add cookie clearing and session destruction on logout.

### P1-04 — Cross-site request forgery and OAuth login-CSRF protections are absent

- **Status:** `[ ]`
- **Evidence:** cross-site credentialed CORS plus cookie sessions; `server/routes/auth.js`; OAuth strategies
- SameSite=None is required by the current separate domains, which removes SameSite's CSRF protection for state-changing endpoints. OAuth state is not explicitly enabled.
- **Required change:** use CSRF tokens (or a rigorously checked Origin/Referer strategy for JSON APIs), restrict allowed origins/methods/headers, enable OAuth `state`, and test login/logout/message/delete CSRF scenarios. Consider serving API and frontend under one site to simplify cookie security.

### P1-05 — No request validation, normalization, or bounded payloads

- **Status:** `[x]`
- **Evidence:** all controllers; `express.json()` and duplicate body parsers use defaults
- Names, participant arrays, message objects/content/type, IDs, and media public IDs are trusted. Invalid ObjectIds become 500s; arbitrarily large content/member lists can create cost and denial-of-service problems.
- **Required change:** define schemas for params/query/body; reject unknown keys; enforce ObjectId format, string lengths, allowed media types, member count, uniqueness, and message size; set small JSON/form limits; add a centralized error mapper and stable error contract.

### P1-06 — Message writes trust client identity and are not atomic

- **Status:** `[x]`
- **Evidence:** `server/controllers/conversationController.js#createMessage`
- The server inserts the client-supplied `message` object before confirming the conversation exists or membership. If the conversation update fails, an orphan Message remains. A client controls `senderId`, `seenBy`, and timestamps/extra fields.
- **Required change:** build the message server-side from the authenticated actor and whitelisted fields; verify membership first; write Message plus conversation metadata in a transaction, or redesign Message with `conversationId` and handle consistency explicitly; return the canonical populated message for Socket.IO emission.

### P1-07 — Conversation creation allows duplicates and arbitrary membership

- **Status:** `[x]`
- **Evidence:** `createConversation`, `createGroupConversation`
- Repeated clicks/races can create duplicate personal conversations. A caller can omit themselves, include duplicate/invalid users, or create groups on behalf of others.
- **Required change:** inject the authenticated actor, validate existing users and limits, canonicalize/dedupe participants, require the actor's membership, and use an idempotency key or deterministic participant-pair key with a unique index for personal chats.

### P1-08 — Cache is user-poisoned, stale, process-local, and too long-lived

- **Status:** `[x]`
- **Evidence:** `server/controllers/conversationController.js#getConversation`
- A user-filtered populate is cached only by conversation ID for 1000 seconds. Different users receive the wrong participant view. Deletion and other mutations do not consistently invalidate it. Every server instance has a different cache.
- **Required change:** remove this cache until authorization and measurement are correct. Prefer pagination/indexes. If caching is later justified, cache an authorization-neutral DTO with short TTL, versioned invalidation, and a shared store where required.

### P1-09 — OAuth strategies and deserialization have correctness and account-linking risks

- **Status:** `[x]`
- **Evidence:** `server/config/passport.js`
- Facebook's callback expects `req` without `passReqToCallback`, shifting arguments and breaking login. Both strategies assume email/photo/name arrays exist. Linking provider identity solely by an email match needs an explicit verified-email policy. `deserializeUser` may never call `cb` when no user is found and does not wrap the whole async operation safely.
- **Required change:** correct callback signatures; require/verify provider email before linking; handle absent profile fields; normalize email; use an atomic upsert guarded by provider ID and unique canonical email; always invoke `done`; add success/failure integration tests for both providers.

### P1-10 — Database connection failure does not fail startup

- **Status:** `[x]`
- **Evidence:** `server/config/database.js`, `server/index.js`
- Connection errors are logged and swallowed while the HTTP server starts immediately. The service can report as running while every database-backed route is broken.
- **Required change:** validate required environment variables, await MongoDB before listening, exit non-zero on startup failure, expose separate liveness/readiness endpoints, and define connection/pool/timeouts.

### P1-11 — Rate limits, security headers, and transport controls are missing

- **Status:** `[x]`
- **Evidence:** `server/index.js`, `server/sockets/chatSockets.js`
- There are no rate limits for OAuth, directory search, message creation, calls, or socket events; no Helmet/security-header policy; and no Socket.IO message-size/connection controls.
- **Required change:** add route-specific account/IP/user limits, socket event throttles and `maxHttpBufferSize`, Helmet with a tested CSP, HTTPS/HSTS at the edge, and deliberate request timeouts.

### P1-12 — Read-receipt logic is incorrect and incomplete

- **Status:** `[x]`
- **Evidence:** `readMessages`; `client/src/components/Chats/Chats.tsx`
- ObjectId is compared to a string with strict inequality; `seenBy.includes(string)` is unreliable for ObjectIds. Only the last message is marked, so “read conversation” leaves earlier messages unread. The client considers a message seen when `seenBy.length >= participants.length`, although the sender normally should not be counted.
- **Required change:** define receipt semantics, store typed user ObjectIds, use atomic `$addToSet` updates for all relevant messages (or a per-user read cursor), and derive “seen by all” from non-sender participants.

### P1-13 — Delete behavior is undefined and can accumulate inaccessible data

- **Status:** `[ ]` **DB/product decision required**
- **Evidence:** `deleteConversation`
- The UI says deletion cannot be undone, but the server only hides the conversation from one user's array. Messages and conversation remain, and no per-user deletion metadata or retention policy exists.
- **Required change:** choose one contract: per-user hide/leave with explicit state, or true deletion with retention/cascade rules. For groups, distinguish leave from delete. Enforce authorization and clear caches. Do not cascade production data until backup/restore and migration tests pass.

---

## P1 — Frontend blockers

### P1-FE-01 — API helpers swallow failures, causing false React Query success

- **Status:** `[x]`
- **Evidence:** `client/src/api/auth.ts`, `client/src/api/conversation.ts`
- Every helper catches and logs errors without rethrowing. React Query treats `undefined` as success, so failed create/delete calls can show success, navigate, or mutate cache. Login can render a blank page because failed verify resolves successfully with no user.
- **Required change:** centralize error normalization and throw on non-success; distinguish 401/403/404/validation/network errors; show retry/error UI; ensure mutations only apply success effects after a valid response.

### P1-FE-02 — Route/auth state handling can crash or show protected UI incorrectly

- **Status:** `[x]`
- **Evidence:** `App.tsx`, `Header.tsx`, `LoginPage.tsx`, `RoomPage.tsx`
- There is no auth route boundary. Effects access `data.conversations` and `user._id` without always guarding data. Room access depends on transient context, and its effect has stale dependencies.
- **Required change:** add an authenticated route/layout with explicit loading, authenticated, unauthenticated, and error states; obtain identity from one query; validate conversation/call access server-side; add an error boundary and not-found/forbidden screens.

### P1-FE-03 — Six module-level Socket.IO clients create presence and lifecycle failures

- **Status:** `[x]`
- **Evidence:** `ChatHeader.tsx`, `ChatInput.tsx`, `Chats.tsx`, `Header.tsx`, `PeopleItems.tsx`, `IncomingVideoCallWidget.tsx`
- Six independent sockets open on initial load. They emit parallel connection events, leak listeners across mounts, double-register user maps on the server, and make multi-tab presence inaccurate.
- **Required change:** create a single shared Socket.IO singleton/hook, tie connection/disconnection to auth lifecycle, clean up all listeners on unmount, and make presence tracking per-user instead of per-socket.

### P1-FE-04 — Video-call signalling is globally visible and call lifecycle is incomplete

- **Status:** `[x]`
- **Evidence:** `ChatHeader.tsx`, call widgets, `chatSockets.js`
- Calls broadcast identity/avatar/conversation metadata. Recipients are inferred client-side. Reject/end/timeout events are incomplete, room IDs are predictable conversation IDs, and group calls do not target a defined set of users.
- **Required change:** create a server-side call resource with authorized invitees, opaque call ID, states (ringing/accepted/rejected/cancelled/ended/expired), targeted user-room events, idempotent transitions, and short-lived provider tokens.

### P1-FE-05 — Direct unsigned Cloudinary upload flow lacks server authorization

- **Status:** `[ ]`
- **Evidence:** `CloudinaryUploadWidget.tsx`, `client/.env.example`
- The browser uses a public upload preset directly and the server accepts any returned public ID as a message. Unless the Cloudinary preset is tightly restricted externally, anyone can consume storage/bandwidth or reference unexpected assets.
- **Required change:** use authenticated signed uploads or tightly constrained unsigned presets (types, size, folder, transformations); validate upload metadata server-side before creating a message; configure moderation/deletion/retention and webhook signature verification where used.

### P1-FE-06 — Initial bundle is far beyond a reasonable chat-app budget

- **Status:** `[ ]`
- **Evidence:** production build output
- The main JS is 7.57 MB minified / 1.67 MB gzip. ZEGOCLOUD emits hundreds of `eval` warnings, complicating a strict CSP. Video, emoji, upload, and modal functionality is eagerly imported.
- **Required change:** route/component lazy loading; load video SDK only in a call; load emoji/upload widgets on demand; inspect the bundle; remove unused packages; test whether the video SDK can run under the selected CSP without unsafe-eval; set enforceable JS/CSS/media budgets in CI.

### P1-FE-07 — Client state is mutated in place and has invalid-index paths

- **Status:** `[ ]`
- **Evidence:** `ChatInput.tsx`, `Header.tsx`, `Chats.tsx`
- Nested conversation/message arrays are mutated after shallow copies. `updateUser()` uses `splice(-1, 1)` if a conversation is not found, moving the wrong conversation. Optimistic socket messages can diverge from server-created IDs/timestamps and are not deduplicated.
- **Required change:** normalize cache data, use immutable functional updates, use client-generated idempotency IDs reconciled to canonical server messages, guard missing indexes, and add optimistic rollback/reconnect tests.

### P1-FE-08 — No meaningful automated frontend or end-to-end coverage

- **Status:** `[ ]`
- **Evidence:** no test script/test files
- **Required change:** add component/unit tests for auth states and state reducers; API contract/integration tests; and browser E2E for OAuth test login, personal/group chat, unauthorized conversation, reconnect, multi-tab presence, media upload, calls, deletion, and failure/offline cases.

---

## P2 — Database and migration work

### P2-DB-01 — `Conversation.messages` grows without pagination and can hit MongoDB's document limit

- **Status:** `[ ]` **DB migration**
- **Evidence:** `server/models/Conversation.js`, `getConversation`
- Every message ObjectId is embedded and every conversation read populates the entire history. Query cost and response size grow without bound, eventually approaching MongoDB's 16 MB document limit.
- **Required change:** add `conversationId` to Message, index `(conversationId, createdAt, _id)`, implement cursor pagination, and stop embedding all message IDs after a dual-write/backfill migration.

### P2-DB-02 — Required indexes and uniqueness constraints are missing

- **Status:** `[ ]` **DB migration**
- **Evidence:** all models
- Candidate indexes include canonical email/provider IDs, conversation membership/type, message conversation/time, and personal participant-pair key. Unique indexes must not be created before duplicate/orphan analysis.
- **Required change:** capture real query plans, inventory duplicates, normalize data, create indexes in a staging clone, monitor build load, then roll out. Prefer an explicit unique canonical email field after merge policy is decided.

### P2-DB-03 — Schemas permit structurally invalid records

- **Status:** `[ ]` **DB-compatible tightening**
- `Conversation.type/name/participants` lack required and conditional validation. `seenBy` is untyped. User/provider/email fields lack normalization and select rules. Most schemas lack `timestamps`.
- **Required change:** introduce validation for new writes first, clean legacy records, use typed refs for `seenBy`, add immutable server timestamps, and use explicit DTOs rather than returning raw Mongoose documents.

### P2-DB-04 — User conversation references duplicate membership state

- **Status:** `[ ]` **DB/product decision**
- Membership exists in both `Conversation.participants` and `User.conversations[].conversation`, so partial failures can create orphans and disagreement.
- **Required change:** choose a source of truth. A membership collection is appropriate if per-user hide/read/role state is needed; otherwise query indexed conversation participants. Avoid a cosmetic field-shape migration until the ownership model is decided.

### P2-DB-05 — Production data needs an integrity inventory before schema changes

- **Status:** `[ ]`
- The original audit mentions 46 users but this was not verified against a database in this review. No production DB was connected to or modified.
- **Required change:** on a sanitized clone, report duplicate canonical emails/provider IDs, orphaned conversation/message/user refs, invalid participant counts, duplicate personal pairs, oversized conversations, message counts, and missing lastMessage targets. Take and restore-test a backup before migrations.

## Safe database migration sequence

1. Take an encrypted snapshot and prove it restores into an isolated environment.
2. Run read-only integrity reports; define merge/retention rules and expected counts.
3. Deploy schema additions that are optional and backward compatible.
4. Dual-write new message/membership fields with metrics and idempotency.
5. Backfill in resumable bounded batches; log checkpoints and rejects without message content.
6. Compare old/new reads and counts in shadow mode.
7. Create non-unique indexes, then dedupe and create unique indexes where justified.
8. Switch reads behind a rollback flag.
9. Stop old writes only after an observation window.
10. Remove legacy arrays/fields in a later release, not the same deployment.

---

## P2 — Frontend correctness and quality

### P2-FE-01 — Production avatar sizing uses dynamic Tailwind classes

- **Status:** `[x]`
- **Evidence:** `OnlineAvatar.tsx`
- `w-${width}` and `h-${height}` are not statically discoverable and may be absent from production CSS. Use a typed static size map or inline dimensions.

### P2-FE-02 — Chat input has newline and resize bugs

- **Status:** `[x]`
- **Evidence:** `ChatInput.tsx`
- Enter always sends, so Shift+Enter cannot insert a newline. Resize checks stale `text`, then assigns height redundantly. Use the input value and send only on Enter without Shift/IME composition.

### P2-FE-03 — Room lifecycle is not cleaned up and redirects to a hardcoded production URL

- **Status:** `[x]`
- **Evidence:** `Room.tsx`
- Leaving locally redirects to the deployed domain. The ref callback can create SDK instances during React lifecycle changes and has no explicit destroy/leave cleanup. Use environment-neutral routing and a lifecycle effect with teardown.

### P2-FE-04 — Responsive layout is not reactive

- **Status:** `[ ]`
- **Evidence:** `ChatPage.tsx`
- `window.innerWidth` is sampled during render with no resize subscription and duplicates CSS breakpoints. Use responsive CSS or a tested media-query hook.

### P2-FE-05 — Theme/Auth contexts mix unrelated high-churn state

- **Status:** `[ ]`
- **Evidence:** both context files
- Call state, modals, uploads, chat receipts, presence, theme, and auth share broad providers, causing avoidable rerenders and unclear ownership. Split by domain or use a small store/reducer with selectors after correctness is stabilized.

### P2-FE-06 — TypeScript safety is substantially disabled

- **Status:** `[ ]`
- `noImplicitAny`, unused checks, and many component/API types are disabled or `any`. Several runtime failures are hidden by this. Turn on strict checks incrementally, define API DTOs, type React Query data/errors, and generate or share contracts.

### P2-FE-07 — CSS/build warnings and source defects need cleanup

- **Status:** `[ ]`
- Configure CSS nesting before Tailwind or rewrite nested CSS; fix the literal backtick in `Chats.tsx`'s className; rename `ChatBubbe.tsx`; remove template assets and dead commented code; stop render-time state changes in the Cloudinary widget.

### P2-FE-08 — Accessibility and error UX are incomplete

- **Status:** `[ ]`
- Icon-only clickable `div`/SVG controls lack button semantics and accessible names; dialogs need focus management; images need meaningful/fallback alt behavior; loading/error/empty states are inconsistent. Add keyboard/focus/screen-reader tests and visible retry paths.

---

## P1/P2 — Operations, deployment, and repository readiness

### OPS-01 — No CI release gate

- **Priority:** P1
- **Status:** `[ ]`
- Add CI on every change: clean install, formatting, lint, typecheck, unit/integration tests, production build, dependency audit/SCA, secret scan, and migration checks. Protect the main branch and require passing checks.

### OPS-02 — No backend test harness or testable app/server separation

- **Priority:** P1
- **Status:** `[ ]`
- Export the Express app separately from the listener, inject database/session/socket dependencies, and add tests using an isolated database. Never point tests at production.

### OPS-03 — No health, shutdown, or deployment lifecycle

- **Priority:** P1
- **Status:** `[ ]`
- Add `/health/live` and dependency-aware `/health/ready`; handle SIGTERM by stopping new requests, draining HTTP/socket connections, closing session/database clients, and exiting within the platform deadline. Define zero-downtime migration order.

### OPS-04 — Logging and observability are insufficient and may leak data

- **Priority:** P1
- **Status:** `[ ]`
- Replace ad hoc console output with structured logs including request/correlation IDs and redaction. Never log message content, tokens, OAuth profiles, cookies, or connection strings. Add error reporting, latency/error-rate/socket metrics, DB pool metrics, and alerts.

### OPS-05 — Environment validation and secret lifecycle are incomplete

- **Priority:** P1
- **Status:** `[~]`
- `.gitignore` and `.env.example` files now exist and local server env keys are no longer duplicated. Add startup schema validation, separate environment values in the hosting platform, least-privilege DB/provider credentials, rotation/revocation procedures, and secret scanning in CI. Remove the ZEGOCLOUD secret from `client/.env.example` after moving it server-side.

### OPS-06 — Root developer workflow and documentation are absent

- **Priority:** P2
- **Status:** `[ ]`
- Add a root README with architecture, prerequisites, env setup, local ports, OAuth callback setup, data-safety warnings, scripts, testing, deployment, rollback, and incident contacts. Add root workspace scripts or a task runner for `dev`, `build`, `lint`, `test`, and `audit` across client/server.

### OPS-07 — Dependency ownership is untidy

- **Priority:** P2
- **Status:** `[ ]`
- Remove unused packages (`cookie-session`, likely `cookie-parser`, unused `morgan`, unused client packages after verification); move `nodemon` to devDependencies; avoid duplicate body parsing; document Node/npm versions with `engines` and a version file; use lockfile v3 after the toolchain upgrade.

### OPS-08 — Deployment configuration is one-sided

- **Priority:** P2
- **Status:** `[ ]`
- `client/vercel.json` only provides SPA rewrites. Add/document backend deployment config, allowed origins, proxy behavior, WebSocket support, sticky/shared state requirements, TLS/domain/cookie design, MongoDB network rules, backups, scaling limits, and rollback steps.

---

## Recommended implementation order

### Phase 0 — Contain and establish a safe baseline

1. Rotate the ZEGOCLOUD server secret and any secret known to have been exposed outside controlled stores.
2. Create a sanitized staging database from a tested backup; never develop against production.
3. Upgrade vulnerable dependencies in small tested groups and remove unused packages.
4. Add minimal CI, backend test harness, frontend lint configuration, and security regression scaffolding.

### Phase 1 — Identity and transport boundary

1. Validate environment at startup and await the database.
2. Configure durable sessions, proxy/cookies, Passport order, OAuth state, CSRF, CORS, and logout/session rotation.
3. Add one Axios client with credentials and one Socket.IO client.
4. Protect the user directory and all conversation routes.

### Phase 2 — Authorization and canonical writes

1. Add request schemas and a centralized error contract.
2. Derive actor identity only from the session.
3. Add conversation membership/role checks to every controller.
4. Make conversation/message operations idempotent and atomic; return canonical records.
5. Add rate/size limits and security headers.

### Phase 3 — Secure real-time and media flows

1. Authenticate sockets with the shared session.
2. Authorize room membership and replace every global private broadcast.
3. Implement correct multi-tab presence and acknowledgement/reconnect behavior.
4. Implement server-side call state and ZEGOCLOUD token issuance.
5. Secure Cloudinary uploads and asset validation.

### Phase 4 — Data scale and integrity

1. Run the integrity inventory and decide membership/delete/read-receipt semantics.
2. Add message pagination through the dual-write/backfill plan.
3. Add measured indexes and uniqueness only after deduplication.
4. Remove the current cache; reintroduce caching only from profiling evidence.

### Phase 5 — Frontend reliability and performance

1. Add explicit auth/error route states and error boundaries.
2. Fix immutable cache updates, receipt semantics, input/video lifecycle, and UI errors.
3. Code-split provider/media/editor dependencies and enforce bundle budgets.
4. Tighten TypeScript and accessibility.

### Phase 6 — Production gate and rollout

1. Complete integration/E2E, authorization matrix, reconnect/multi-tab, load, and restore tests.
2. Add readiness, graceful shutdown, observability, alerts, dashboards, and runbooks.
3. Deploy to staging with production topology; run smoke/load/security tests.
4. Roll out gradually with rollback flags and database compatibility maintained.

## Definition of production ready

All of the following must be true before general availability:

- [ ] No unauthenticated/private API or socket access; authorization matrix tests pass.
- [ ] No client-side server secrets or test-token generation; exposed credentials rotated.
- [ ] Production dependency audit has no unaccepted critical/high findings.
- [ ] Durable sessions, correct cross-origin cookie behavior, CSRF/OAuth state, and secure logout are verified in the real deployment topology.
- [ ] Every API/socket payload is validated and bounded; abuse controls are load-tested.
- [ ] Messages are paginated; DB migrations are backup-tested, resumable, monitored, and rollback-safe.
- [ ] Unit, integration, contract, and critical-path browser E2E suites pass in CI.
- [ ] Lint, strict-enough typecheck, build, tests, security scans, and bundle budgets are required merge gates.
- [ ] Health/readiness, graceful shutdown, structured redacted logs, metrics, alerts, backups, restore drills, and incident/rollback runbooks exist.
- [ ] Staging matches production topology and completes OAuth, chat, media, call, reconnect, multi-tab, and failure-mode smoke tests.

## Current safe changes from the earlier audit

- `[x]` Added a root `.gitignore` covering dependencies, env files, builds, logs, editor files, and temp files.
- `[x]` Added `client/.env.example` and `server/.env.example` without real credential values.
- `[x]` Removed duplicate local server env keys and aligned local client/server ports (verified by key inventory, values not printed in this audit).
- `[x]` Added a backend default port and a frontend dev port for local startup.
- `[ ]` These setup changes do **not** make the application production ready; the P0/P1 work above remains required.
