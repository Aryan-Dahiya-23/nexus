import Conversation from "../models/Conversation.js";

// Multi-tab tracking: Map<userId, Set<socketId>>
const userSocketMap = new Map();

const getOnlineUserIds = () => Array.from(userSocketMap.keys());

const initializeChatSockets = (io) => {
    // Socket authentication middleware: extracts user identity from session
    io.use((socket, next) => {
        const rawUser = socket.request?.user || socket.request?.session?.passport?.user;
        if (!rawUser) {
            return next(new Error("Authentication error: No active session"));
        }
        const userId = (rawUser._id || rawUser).toString();
        socket.userId = userId;
        socket.data = socket.data || {};
        socket.data.userId = userId;
        socket.data.user = rawUser;
        return next();
    });

    io.on('connection', (socket) => {
        const userId = socket.userId || socket.data?.userId;
        if (!userId) {
            socket.disconnect(true);
            return;
        }

        // Track multi-tab presence
        if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId).add(socket.id);

        // Join private user room for 1-to-1 notifications & private calls
        socket.join(`user:${userId}`);

        // Broadcast updated online presence list
        io.emit('connected users', getOnlineUserIds());

        // Explicit user connected signal from frontend (rely exclusively on session identity)
        socket.on('user connected', () => {
            const actorId = socket.userId || socket.data?.userId;
            if (actorId) {
                if (!userSocketMap.has(actorId)) {
                    userSocketMap.set(actorId, new Set());
                }
                userSocketMap.get(actorId).add(socket.id);
                socket.join(`user:${actorId}`);
                io.emit('connected users', getOnlineUserIds());
            }
        });

        // Join conversation room after verifying database membership
        socket.on('join conversation', async (conversationId) => {
            if (!conversationId) return;
            const actorId = socket.userId || socket.data?.userId;
            if (!actorId) return;

            try {
                const conv = await Conversation.findById(conversationId).select('participants');
                if (conv && conv.participants.some(p => (p._id ? p._id.toString() : p.toString()) === actorId)) {
                    socket.join(`conversation:${conversationId}`);
                }
            } catch (err) {
                console.error("Error joining conversation room:", err);
            }
        });

        socket.on('leave conversation', (conversationId) => {
            if (conversationId) {
                socket.leave(`conversation:${conversationId}`);
            }
        });

        // Chat message: Broadcast strictly to conversation room AND participants' user rooms
        socket.on('chat message', async (clientSenderId, newMessage, conversationId) => {
            const actorId = socket.userId || socket.data?.userId;
            if (!conversationId || !actorId) return;

            try {
                const conv = await Conversation.findById(conversationId).select('participants');
                if (conv && conv.participants.some(p => (p._id ? p._id.toString() : p.toString()) === actorId)) {
                    // Send to all participants' individual user rooms (ensures conversation list update & chat updates)
                    conv.participants.forEach((pId) => {
                        const targetId = (pId._id ? pId._id.toString() : pId.toString());
                        io.to(`user:${targetId}`).emit('chat message', actorId, newMessage, conversationId);
                    });
                }
            } catch (err) {
                console.error("Error broadcasting chat message:", err);
            }
        });

        socket.on('message sent', async (clientSenderId, conversationId) => {
            const actorId = socket.userId || socket.data?.userId;
            if (!conversationId || !actorId) return;

            try {
                const conv = await Conversation.findById(conversationId).select('participants');
                if (conv && conv.participants.some(p => (p._id ? p._id.toString() : p.toString()) === actorId)) {
                    conv.participants.forEach((pId) => {
                        const targetId = (pId._id ? pId._id.toString() : pId.toString());
                        io.to(`user:${targetId}`).emit('message sent', actorId, conversationId);
                    });
                }
            } catch (err) {
                console.error("Error broadcasting message sent:", err);
            }
        });

        socket.on('seen message', async (conversationId) => {
            if (!conversationId) return;
            const actorId = socket.userId || socket.data?.userId;
            if (!actorId) return;

            try {
                const conv = await Conversation.findById(conversationId).select('participants');
                if (conv && conv.participants.some(p => (p._id ? p._id.toString() : p.toString()) === actorId)) {
                    conv.participants.forEach((pId) => {
                        const targetId = (pId._id ? pId._id.toString() : pId.toString());
                        io.to(`user:${targetId}`).emit('seen message', conversationId);
                    });
                }
            } catch (err) {
                console.error("Error broadcasting seen message:", err);
            }
        });

        socket.on('new conversation', (targetUserId) => {
            const actorId = socket.userId || socket.data?.userId;
            if (targetUserId && actorId) {
                io.to(`user:${targetUserId}`).emit('new conversation', actorId);
            }
        });

        // Video call signaling: Emit ONLY to the other participants in the conversation
        socket.on('video call', async (name, avatarSrc, clientCallerId, conversationId) => {
            const actorId = socket.userId || socket.data?.userId;
            if (!conversationId || !actorId) return;

            try {
                const conv = await Conversation.findById(conversationId).select('participants');
                if (conv && conv.participants.some(p => (p._id ? p._id.toString() : p.toString()) === actorId)) {
                    conv.participants.forEach((pId) => {
                        const targetId = (pId._id ? pId._id.toString() : pId.toString());
                        if (targetId !== actorId) {
                            io.to(`user:${targetId}`).emit('video call', name, avatarSrc, actorId, conversationId);
                        }
                    });
                }
            } catch (err) {
                console.error("Error signaling video call:", err);
            }
        });

        socket.on('accept video call', (callerId, conversationId) => {
            const actorId = socket.userId || socket.data?.userId;
            if (callerId && actorId) {
                io.to(`user:${callerId}`).emit('accept video call', conversationId);
            }
        });

        socket.on('reject video call', (callerId, conversationId) => {
            const actorId = socket.userId || socket.data?.userId;
            if (callerId && actorId) {
                io.to(`user:${callerId}`).emit('reject video call', conversationId);
            }
        });

        socket.on('disconnect', () => {
            const actorId = socket.userId || socket.data?.userId;
            if (actorId && userSocketMap.has(actorId)) {
                const userSockets = userSocketMap.get(actorId);
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    userSocketMap.delete(actorId);
                    io.emit('connected users', getOnlineUserIds());
                }
            }
        });
    });
};

export default initializeChatSockets;
