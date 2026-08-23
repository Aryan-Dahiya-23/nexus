import "dotenv/config";
import express from "express";
import { createServer } from 'node:http';
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
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

const app = express();
const isProd = process.env.NODE_ENV === "production";
const origin = process.env.CLIENT_URL || "http://localhost:5174";

// Trust proxy before session middleware (crucial for Render/reverse-proxies)
app.set("trust proxy", 1);

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

// Durable session configuration with MongoStore
app.use(
    session({
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
    })
);

// Correct Passport middleware order
app.use(passport.initialize());
app.use(passport.session());

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

// Startup lifecycle
const port = process.env.PORT || 4000;

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
