import "dotenv/config";
import express from "express";
import { createServer } from 'node:http';
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import passport from "passport";
import { connectToDatabase } from "./config/database.js";
import initializeChatSockets from "./sockets/chatSockets.js";
import "./config/passport.js";
import authRouter from "./routes/auth.js";
import conversationRouter from "./routes/conversation.js";

const isProd = process.env.NODE_ENV === "production";
const origin = process.env.CLIENT_URL || "http://localhost:5174";

// Environment variable validation on startup (OPS-05)
function validateEnvironment() {
    const required = ["MONGO_URL", "SECRET_KEY"];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error(`FATAL: Missing required environment variable(s): ${missing.join(", ")}`);
        process.exit(1);
    }
    if (isProd) {
        const recommended = ["CLIENT_URL", "ZEGO_APP_ID", "ZEGO_SERVER_SECRET"];
        const missingProd = recommended.filter(key => !process.env[key]);
        if (missingProd.length > 0) {
            console.warn(`WARNING: Missing recommended production variable(s): ${missingProd.join(", ")}`);
        }
    }
}
validateEnvironment();

const app = express();

// Trust proxy before session middleware (crucial for Render/reverse-proxies)
app.set("trust proxy", 1);

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
}));

// Rate limiting (protect authentication and API routes against brute-force / DoS)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 300 : 1500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: true, message: "Too many requests, please try again after a few minutes." }
});

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: origin,
        credentials: true,
    },
});

// Middleware
app.use(cors({ credentials: true, origin: origin }));
app.use(express.json());
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Request Origin / Referer validation for state-changing requests (CSRF Defense - P1-04)
app.use((req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const reqOrigin = req.headers.origin || req.headers.referer;
        if (reqOrigin && isProd) {
            const allowedOrigins = [process.env.CLIENT_URL, "https://nexus-aryan.vercel.app"];
            const isAllowed = allowedOrigins.some(allowed => allowed && reqOrigin.startsWith(allowed));
            if (!isAllowed) {
                return res.status(403).json({ error: true, message: "Forbidden: Invalid request origin" });
            }
        }
    }
    next();
});

app.use("/auth/", apiLimiter);
app.use("/conversation/", apiLimiter);

// Durable session configuration with MongoStore
const sessionMiddleware = session({
    secret: process.env.SECRET_KEY || "nexus_fallback_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        ttl: 7 * 24 * 60 * 60, // 7 days
        autoRemove: 'native',
    }),
    cookie: {
        secure: isProd,
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
});

app.use(sessionMiddleware);

// Correct Passport middleware order
app.use(passport.initialize());
app.use(passport.session());

// Share session and authentication with Socket.IO
const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

// Initialize Sockets
initializeChatSockets(io);

// Health check endpoints
app.get("/health/live", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/health/ready", (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
        res.status(200).json({ status: "ready", database: "connected" });
    } else {
        res.status(503).json({ status: "not_ready", database: "disconnected" });
    }
});

// Routers
app.use('/auth', authRouter);
app.use('/conversation', conversationRouter);

app.get("/", (req, res) => {
    res.send("Hello Live Chat App");
});

// Startup & Shutdown lifecycle (OPS-03)
const port = process.env.PORT || 4000;

let isShuttingDown = false;

async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    // Stop accepting new HTTP requests
    server.close(async () => {
        console.log("HTTP server closed.");

        // Close Socket.IO connections
        try {
            await io.close();
            console.log("Socket.IO engine closed.");
        } catch (err) {
            console.error("Error closing Socket.IO:", err);
        }

        // Close MongoDB connection
        try {
            await mongoose.connection.close(false);
            console.log("MongoDB connection closed cleanly.");
        } catch (err) {
            console.error("Error closing MongoDB connection:", err);
        }

        console.log("Graceful shutdown complete. Exiting.");
        process.exit(0);
    });

    // Enforce 10s maximum deadline for active connections to drain
    setTimeout(() => {
        console.error("Graceful shutdown deadline exceeded (10s). Forcing exit.");
        process.exit(1);
    }, 10000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

async function startServer() {
    try {
        await connectToDatabase(process.env.MONGO_URL);
        server.listen(port, () => {
            console.log(`Server is listening on port ${port} (NODE_ENV: ${process.env.NODE_ENV})`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();
