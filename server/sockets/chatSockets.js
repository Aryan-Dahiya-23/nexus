import Conversation from "../models/Conversation.js";

// Multi-tab tracking: Map<userId, Set<socketId>>
const userSocketMap = new Map();

const getOnlineUserIds = () => Array.from(userSocketMap.keys());

const initializeChatSockets = (io) => {
    // Socket authentication middleware: extracts user identity from session
    io.use((socket, next) => {
        const sessionUser = socket.request?.user;
        if (sessionUser && sessionUser._id) {
            socket.data.userId = sessionUser._id.toString();
            socket.data.user = sessionUser;
        }
        return next();
    });

    io.on('connection', (socket) => {
        // Fallback to handshake auth if session cookie wasn't forwarded
        const userId = socket.data?.userId || socket.handshake.auth?.userId;

        if (userId) {
            socket.data.userId = userId;

            // Track multi-tab presence
            if (!userSocketMap.has(userId)) {
                userSocketMap.set(userId, new Set());
            }
            userSocketMap.get(userId).add(socket.id);

            // Join private user room for 1-to-1 notifications & private calls
            socket.join(`user:${userId}`);

            // Broadcast updated online presence list
            io.emit('connected users', getOnlineUserIds());
        }

        // Explicit user connected signal from frontend
        socket.on('user connected', (clientUserId) => {
            const effectiveUserId = socket.data?.userId || clientUserId;
            if (effectiveUserId) {
                socket.data.userId = effectiveUserId;
                if (!userSocketMap.has(effectiveUserId)) {
                    userSocketMap.set(effectiveUserId, new Set());
                }
                userSocketMap.get(effectiveUserId).add(socket.id);
                socket.join(`user:${effectiveUserId}`);
                io.emit('connected users', getOnlineUserIds());
            }
        });

        // Join conversation room after verifying database membership
        socket.on('join conversation', async (conversationId) => {
            if (!conversationId) return;
            const actorId = socket.data?.userId;
            if (!actorId) return;

            try {
                const conv = await Conversation.findById(conversationId).select('participants');
                if (conv && conv.participants.some(p => p.toString() === actorId)) {
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
        socket.on('chat message', async (senderId, newMessage, conversationId) => {
            const actorId = socket.data?.userId || senderId;
            if (!conversationId || !actorId) return;

            try {
                const conv = await Conversation.findById(conversationId).select('participants');
                if (conv && conv.participants.some(p => p.toString() === actorId)) {
                    // Send to all participants' individual user rooms (ensures conversation list update & chat updates)
                    conv.participants.forEach((pId) => {
                        io.to(`user:${pId.toString()}`).emit('chat message', actorId, newMessage, conversationId);
                    });
                }
            } catch (err) {
                console.error("Error broadcasting chat message:", err);
            }
        });

        socket.on('message sent', async (senderId, conversationId) => {
            const actorId = socket.data?.userId || senderId;
            if (!conversationId || !actorId) return;

            try {
                const conv = await Conversation.findById(conversationId).select('participants');
                if (conv && conv.participants.some(p => p.toString() === actorId)) {
                    conv.participants.forEach((pId) => {
                        io.to(`user:${pId.toString()}`).emit('message sent', actorId, conversationId);
                    });
                }
            } catch (err) {
                console.error("Error broadcasting message sent:", err);
            }
        });

        socket.on('seen message', async (conversationId) => {
            if (!conversationId) return;
            const actorId = socket.data?.userId;

            try {
                const conv = await Conversation.findById(conversationId).select('participants');
                if (conv && (!actorId || conv.participants.some(p => p.toString() === actorId))) {
                    conv.participants.forEach((pId) => {
                        io.to(`user:${pId.toString()}`).emit('seen message', conversationId);
                    });
                }
            } catch (err) {
                console.error("Error broadcasting seen message:", err);
            }
        });

        socket.on('new conversation', (targetUserId) => {
            const actorId = socket.data?.userId;
            if (targetUserId) {
                io.to(`user:${targetUserId}`).emit('new conversation', actorId);
            }
        });

        // Video call signaling: Emit ONLY to the other participants in the conversation
        socket.on('video call', async (name, avatarSrc, callerId, conversationId) => {
            const actorId = socket.data?.userId || callerId;
            if (!conversationId || !actorId) return;

            try {
                const conv = await Conversation.findById(conversationId).select('participants');
                if (conv && conv.participants.some(p => p.toString() === actorId)) {
                    conv.participants.forEach((pId) => {
                        if (pId.toString() !== actorId.toString()) {
                            io.to(`user:${pId.toString()}`).emit('video call', name, avatarSrc, actorId, conversationId);
                        }
                    });
                }
            } catch (err) {
                console.error("Error signaling video call:", err);
            }
        });

        socket.on('accept video call', (callerId, conversationId) => {
            if (callerId) {
                io.to(`user:${callerId}`).emit('accept video call', conversationId);
            }
        });

        socket.on('reject video call', (callerId, conversationId) => {
            if (callerId) {
                io.to(`user:${callerId}`).emit('reject video call', conversationId);
            }
        });

        socket.on('disconnect', () => {
            const actorId = socket.data?.userId;
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