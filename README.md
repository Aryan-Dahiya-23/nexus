# Nexus 💬 📹

**Nexus** is a real-time chat, group messaging, and video calling application built with **React**, **Express**, **Socket.IO**, and **MongoDB**.

---

## 🏛️ Architecture & System Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                        │
│             React + TypeScript + Tailwind CSS               │
│                  Port: 5174 (Local)                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
            HTTP/S + Credentials (Session Cookie)
            WebSocket + Session Handshake
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend (Render)                         │
│             Express + Socket.IO + Mongoose                  │
│                  Port: 4000 (Local)                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
            Mongoose ODM (Durable Sessions + Models)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Database (MongoDB Atlas)                   │
│      Collections: users, conversations, messages, sessions  │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- **Node.js**: `v18+` or `v20+`
- **npm**: `v9+`
- **MongoDB**: MongoDB Atlas connection URI or local MongoDB daemon.

### 2. Local Port Requirements
> [!IMPORTANT]
> **Strict Port Rule:** The frontend must run on port **`5174`** and the backend must run on port **`4000`** to match OAuth provider callbacks and CORS configurations.

### 3. Installation
Clone the repository and install dependencies:

```bash
# Clone repository
git clone git@github.com:Aryan-Dahiya-23/nexus.git
cd nexus

# Install backend dependencies
cd server && npm install && cd ..

# Install frontend dependencies
cd client && npm install && cd ..
```

### 4. Running the Application

```bash
# Run both frontend & backend concurrently from the root:
npm run dev:client   # Starts Vite frontend on http://localhost:5174
npm run dev:server   # Starts Express backend on http://localhost:4000

# Or run tests across workspaces:
npm test
```

---

## 🔐 Environment Configuration

### Backend (`server/.env`)

| Variable | Description | Example (Local / Production) |
| :--- | :--- | :--- |
| `PORT` | HTTP Server port | `4000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `CLIENT_URL` | Allowed frontend origin for CORS & Cookies | `http://localhost:5174` / `https://nexus-aryan.vercel.app` |
| `MONGO_URL` | MongoDB connection URI | `mongodb+srv://...` |
| `SECRET_KEY` | Session encryption secret | `your_secure_random_key` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your_google_client_id` |
| `GOOGLE_CLIENT_SECRET`| Google OAuth client secret | `your_google_client_secret` |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URI | `http://localhost:4000/auth/google/callback` |
| `FACEBOOK_CLIENT_ID` | Facebook OAuth app ID | `your_fb_app_id` |
| `FACEBOOK_CLIENT_SECRET`| Facebook OAuth app secret | `your_fb_app_secret` |
| `FACEBOOK_CALLBACK_URL`| Facebook OAuth callback URI | `http://localhost:4000/auth/facebook/callback` |
| `ZEGO_APP_ID` | ZEGOCLOUD App ID (Token Minting) | `667370382` |
| `ZEGO_SERVER_SECRET` | ZEGOCLOUD Server Secret (Never expose to client) | `a4ca40baccffce58fef41747feddbf60` |

### Frontend (`client/.env`)

| Variable | Description | Example (Local / Production) |
| :--- | :--- | :--- |
| `VITE_URL` | Backend API base URL | `http://localhost:4000` / `https://nexus-sqpn.onrender.com` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `dq3iqffnu` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset | `odksp3xk` |

---

## 🚀 Live Production Deployments

* **Frontend (Vercel)**: [`https://nexus-aryan.vercel.app`](https://nexus-aryan.vercel.app)
* **Backend (Render)**: [`https://nexus-sqpn.onrender.com`](https://nexus-sqpn.onrender.com)
* **Health Check Endpoints**:
  * `GET /health/live` — Returns `200 OK` (process alive)
  * `GET /health/ready` — Returns `200 OK` when MongoDB is connected (`503` if disconnected)

---

## 🛡️ Key Security Features Implemented

1. **Durable Session Persistence**: Backed by `connect-mongo` (`MongoStore`) with a 7-day TTL and automated session cleanup.
2. **Object-Level Authorization (IDOR)**: Strict participant validation on all conversation and message queries.
3. **Session-Authenticated WebSockets**: Socket.IO connections share Express sessions and join isolated user & conversation rooms.
4. **Backend ZEGOCLOUD Token Issuance**: Secret keys remain on the backend; browsers fetch short-lived tokens via authenticated REST API (`GET /conversation/zego-token/:roomId`).
5. **Rate Limiting & Security Headers**: Helmet headers and Express rate limiting on `/auth` and `/conversation` routes.
6. **Graceful Shutdown**: Intercepts `SIGTERM` / `SIGINT` signals with a 10s connection drain window for zero-downtime rolling deploys.
7. **Bundle Optimization**: Route-level and component-level code splitting reduces the initial JS bundle from **7.5 MB down to ~270 kB** (96.4% reduction).

---

## 📄 License
ISC License © [Aryan Dahiya](https://github.com/Aryan-Dahiya-23)
