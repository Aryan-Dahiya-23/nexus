import mongoose from "mongoose";
import { generateToken04 } from "../utils/zegoServerAssistant.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getZegoToken = async (req, res) => {
    try {
        const { roomId } = req.params;
        const currentUserId = req.user._id;
        const userName = req.user.fullName || "Nexus User";

        if (!roomId || !isValidObjectId(roomId)) {
            return res.status(400).json({ error: true, message: 'Invalid room ID' });
        }

        const conversation = await Conversation.findById(roomId).select('participants');
        if (!conversation) {
            return res.status(404).json({ error: true, message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            p => (p._id ? p._id.toString() : p.toString()) === currentUserId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                error: true,
                message: 'Forbidden: You are not a participant in this conversation'
            });
        }

        const rawAppId = process.env.ZEGO_APP_ID ||
                          process.env.ZEGOCLOUD_APP_ID ||
                          process.env.VITE_ZEGO_APP_ID ||
                          process.env.ZEGO_APPID ||
                          process.env.ZEGOCLOUD_APPID ||
                          "";

        const cleanAppIdStr = String(rawAppId).replace(/['"\s]/g, "");
        const appID = cleanAppIdStr ? parseInt(cleanAppIdStr, 10) : 0;

        const serverSecret = String(
            process.env.ZEGO_SERVER_SECRET ||
            process.env.ZEGOCLOUD_SERVER_SECRET ||
            process.env.ZEGO_SECRET ||
            process.env.ZEGOCLOUD_SECRET ||
            ""
        ).replace(/['"\s]/g, "");

        if (!appID || isNaN(appID) || !serverSecret || serverSecret.length !== 32) {
            console.error("[ZEGOCLOUD] Credentials missing or invalid:", {
                hasAppId: Boolean(appID),
                secretLength: serverSecret ? serverSecret.length : 0
            });
            return res.status(500).json({
                error: true,
                message: "ZEGOCLOUD credentials are not configured. Please set ZEGO_APP_ID and ZEGO_SERVER_SECRET in your environment variables."
            });
        }

        const payloadObject = {
            room_id: roomId.toString(),
            privilege: {
                1: 1, // 1: PrivilegeKeyLogin (1 = allow)
                2: 1  // 2: PrivilegeKeyPublish (1 = allow)
            },
            stream_id_list: null
        };
        const payload = JSON.stringify(payloadObject);

        const token = generateToken04(
            appID,
            currentUserId.toString(),
            serverSecret,
            3600,
            payload
        );

        res.status(200).json({
            error: false,
            token,
            appID,
            roomId,
            userId: currentUserId.toString(),
            userName
        });
    } catch (error) {
        console.error("Error generating Zego token:", error);
        res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

export const getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user._id;
        const INITIAL_MESSAGE_LIMIT = 30;

        if (!isValidObjectId(conversationId)) {
            return res.status(400).json({ error: true, message: 'Invalid conversation ID' });
        }

        const conversation = await Conversation.findById(conversationId)
            .populate({
                path: 'participants',
                model: 'User',
                select: 'fullName picture'
            })
            .populate({
                path: 'lastMessage',
                model: 'Message',
                select: 'content senderId seenBy createdAt type'
            })
            .lean();

        if (!conversation) {
            return res.status(404).json({ error: true, message: 'Conversation not found' });
        }

        // Verify membership (Object-level authorization)
        const isParticipant = conversation.participants.some(
            p => (p._id ? p._id.toString() : p.toString()) === currentUserId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                error: true,
                message: 'Forbidden: You are not a participant in this conversation'
            });
        }

        // Fetch only the latest INITIAL_MESSAGE_LIMIT messages
        const totalMessages = Array.isArray(conversation.messages) ? conversation.messages.length : 0;
        const messageIdsToFetch = totalMessages > INITIAL_MESSAGE_LIMIT
            ? conversation.messages.slice(-INITIAL_MESSAGE_LIMIT)
            : conversation.messages || [];

        const populatedMessages = await Message.find({ _id: { $in: messageIdsToFetch } })
            .sort({ createdAt: 1 })
            .populate({
                path: 'senderId',
                model: 'User',
                select: 'fullName picture'
            })
            .lean();

        const hasMore = totalMessages > populatedMessages.length;

        // Filter out requesting user from participants array for the client view
        const otherParticipants = conversation.participants.filter(
            p => (p._id ? p._id.toString() : p.toString()) !== currentUserId.toString()
        );

        res.status(200).json({
            error: false,
            ...conversation,
            participants: otherParticipants,
            messages: populatedMessages,
            hasMore,
            totalMessagesCount: totalMessages
        });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const createConversation = async (req, res) => {
    try {
        const senderId = req.user._id; // Enforce actor strictly from session
        const { receiverId } = req.body;

        if (!receiverId || !isValidObjectId(receiverId)) {
            return res.status(400).json({ error: true, message: 'Valid receiverId is required' });
        }

        if (senderId.toString() === receiverId.toString()) {
            return res.status(400).json({ error: true, message: 'Cannot create conversation with yourself' });
        }

        // Verify recipient exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ error: true, message: 'Recipient user not found' });
        }

        // Check if personal conversation already exists between these 2 users (Deduplication)
        const existingConv = await Conversation.findOne({
            type: 'personal',
            participants: { $all: [senderId, receiverId], $size: 2 }
        });

        if (existingConv) {
            // Ensure both users have it linked in their conversations array
            await User.updateMany(
                { _id: { $in: [senderId, receiverId] } },
                {
                    $addToSet: {
                        conversations: {
                            conversation: existingConv._id,
                        },
                    },
                }
            );

            return res.status(200).json({
                error: false,
                message: 'Conversation already exists',
                chat: existingConv
            });
        }

        const newChat = new Conversation({
            type: 'personal',
            participants: [senderId, receiverId],
            messages: [],
        });

        const savedChat = await newChat.save();

        await User.updateMany(
            { _id: { $in: [senderId, receiverId] } },
            {
                $addToSet: {
                    conversations: {
                        conversation: savedChat._id,
                    },
                },
            }
        );

        res.status(201).json({
            error: false,
            message: 'Chat created successfully',
            chat: savedChat,
        });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const createGroupConversation = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        let { participants, name } = req.body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: true, message: 'Group name is required' });
        }

        if (!Array.isArray(participants) || participants.length < 1) {
            return res.status(400).json({ error: true, message: 'Group must have at least one other participant' });
        }

        // Normalize participants to IDs and ensure creator is included
        const participantIdList = participants.map(p => (typeof p === 'object' && p?.id ? p.id : p));
        const uniqueParticipantIds = Array.from(new Set([
            ...participantIdList.map(p => p.toString()),
            currentUserId.toString()
        ]));

        if (!uniqueParticipantIds.every(isValidObjectId)) {
            return res.status(400).json({ error: true, message: 'Invalid participant ID provided' });
        }

        const existingUserCount = await User.countDocuments({ _id: { $in: uniqueParticipantIds } });
        if (existingUserCount !== uniqueParticipantIds.length) {
            return res.status(400).json({ error: true, message: 'One or more participants do not exist' });
        }

        const newChat = new Conversation({
            type: 'group',
            name: name.trim(),
            participants: uniqueParticipantIds,
            messages: [],
        });

        const savedChat = await newChat.save();

        await User.updateMany(
            { _id: { $in: uniqueParticipantIds } },
            {
                $addToSet: {
                    conversations: {
                        conversation: savedChat._id,
                    },
                },
            }
        );

        res.status(201).json({
            error: false,
            message: 'Group chat created successfully',
            chat: savedChat
        });
    } catch (error) {
        console.error('Error creating group chat:', error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const createMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user._id;
        const { message } = req.body;

        if (!isValidObjectId(conversationId)) {
            return res.status(400).json({ error: true, message: 'Invalid conversation ID' });
        }

        if (!message || (!message.content && !message.messageUrl)) {
            return res.status(400).json({ error: true, message: 'Message content is required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: true, message: 'Conversation not found' });
        }

        // Authorization check: must be a participant
        const isParticipant = conversation.participants.some(
            p => p.toString() === currentUserId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({
                error: true,
                message: 'Forbidden: You cannot send messages to this conversation'
            });
        }

        // Canonical message creation (server enforces senderId & fields)
        const content = (message.content || message.messageUrl || "").trim();
        const type = message.type || 'text';

        const ALLOWED_TYPES = ['text', 'image', 'video'];
        if (!ALLOWED_TYPES.includes(type)) {
            return res.status(400).json({ error: true, message: `Invalid message type: ${type}` });
        }

        if (type === 'text' && content.length > 5000) {
            return res.status(400).json({ error: true, message: 'Message exceeds maximum length of 5000 characters' });
        }

        if ((type === 'image' || type === 'video') && (content.length === 0 || content.length > 500)) {
            return res.status(400).json({ error: true, message: 'Invalid media asset identifier' });
        }

        const newMessage = await Message.create({
            senderId: currentUserId,
            content: content,
            type: type,
            seenBy: [currentUserId]
        });

        // Populate sender info for canonical response
        const populatedMessage = await Message.findById(newMessage._id).populate({
            path: 'senderId',
            select: 'fullName picture'
        });

        // Update conversation messages & lastMessage
        await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $push: { messages: newMessage._id },
                $set: { lastMessage: newMessage._id }
            }
        );

        return res.status(200).json({
            error: false,
            message: "Message created successfully",
            data: populatedMessage
        });
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

export const readMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user._id;

        if (!isValidObjectId(conversationId)) {
            return res.status(400).json({ error: true, message: 'Invalid conversation ID' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: true, message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === currentUserId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ error: true, message: 'Forbidden' });
        }

        if (conversation.messages && conversation.messages.length > 0) {
            await Message.updateMany(
                {
                    _id: { $in: conversation.messages },
                    seenBy: { $ne: currentUserId }
                },
                {
                    $addToSet: { seenBy: currentUserId }
                }
            );
        }

        res.status(200).json({ error: false, message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error in readMessages:', error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const deleteConversation = async (req, res) => {
    const { userId, conversationId } = req.params;
    const currentUserId = req.user._id;

    if (!isValidObjectId(conversationId) || !isValidObjectId(userId)) {
        return res.status(400).json({ error: true, message: 'Invalid IDs provided' });
    }

    // Only allow the authenticated user to remove conversations from their own list
    if (userId !== currentUserId.toString()) {
        return res.status(403).json({
            error: true,
            message: 'Forbidden: Cannot remove conversations for another user'
        });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            currentUserId,
            { $pull: { conversations: { conversation: conversationId } } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        res.status(200).json({ error: false, message: 'Conversation removed successfully' });
    } catch (error) {
        console.error('Error removing conversation:', error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user._id;
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
        const { before } = req.query;

        if (!isValidObjectId(conversationId)) {
            return res.status(400).json({ error: true, message: 'Invalid conversation ID' });
        }

        const conversation = await Conversation.findById(conversationId).select('participants messages');
        if (!conversation) {
            return res.status(404).json({ error: true, message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            p => (p._id ? p._id.toString() : p.toString()) === currentUserId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({
                error: true,
                message: 'Forbidden: You are not a participant in this conversation'
            });
        }

        const query = { _id: { $in: conversation.messages } };
        if (before) {
            const beforeDate = new Date(before);
            if (!isNaN(beforeDate.getTime())) {
                query.createdAt = { $lt: beforeDate };
            }
        }

        // Fetch limit + 1 to determine if there are more
        const rawMessages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate({
                path: 'senderId',
                model: 'User',
                select: 'fullName picture'
            })
            .lean();

        const hasMore = rawMessages.length > limit;
        const messages = hasMore ? rawMessages.slice(0, limit) : rawMessages;

        // Return in chronological order
        messages.reverse();

        const nextCursor = hasMore && messages.length > 0 ? messages[0].createdAt : null;

        res.status(200).json({
            error: false,
            messages,
            nextCursor,
            hasMore
        });
    } catch (error) {
        console.error('Error in getConversationMessages:', error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { conversationId, messageId } = req.params;
        const currentUserId = req.user._id;
        const { content } = req.body;

        if (!isValidObjectId(conversationId) || !isValidObjectId(messageId)) {
            return res.status(400).json({ error: true, message: 'Invalid conversation or message ID' });
        }

        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ error: true, message: 'Message content is required' });
        }

        if (content.length > 5000) {
            return res.status(400).json({ error: true, message: 'Message exceeds maximum length of 5000 characters' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: true, message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            p => (p._id ? p._id.toString() : p.toString()) === currentUserId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ error: true, message: 'Forbidden: You are not a participant in this conversation' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: true, message: 'Message not found' });
        }

        if (message.senderId.toString() !== currentUserId.toString()) {
            return res.status(403).json({ error: true, message: 'Forbidden: You can only edit your own messages' });
        }

        if (message.isDeleted) {
            return res.status(400).json({ error: true, message: 'Cannot edit a deleted message' });
        }

        if (message.type !== 'text') {
            return res.status(400).json({ error: true, message: 'Only text messages can be edited' });
        }

        message.content = content.trim();
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        const populatedMessage = await Message.findById(message._id).populate({
            path: 'senderId',
            select: 'fullName picture'
        });

        res.status(200).json({
            error: false,
            message: 'Message edited successfully',
            data: populatedMessage
        });
    } catch (error) {
        console.error('Error editing message:', error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { conversationId, messageId } = req.params;
        const currentUserId = req.user._id;

        if (!isValidObjectId(conversationId) || !isValidObjectId(messageId)) {
            return res.status(400).json({ error: true, message: 'Invalid conversation or message ID' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: true, message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            p => (p._id ? p._id.toString() : p.toString()) === currentUserId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ error: true, message: 'Forbidden: You are not a participant in this conversation' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: true, message: 'Message not found' });
        }

        if (message.senderId.toString() !== currentUserId.toString()) {
            return res.status(403).json({ error: true, message: 'Forbidden: You can only delete your own messages' });
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = "This message was deleted";
        await message.save();

        const populatedMessage = await Message.findById(message._id).populate({
            path: 'senderId',
            select: 'fullName picture'
        });

        res.status(200).json({
            error: false,
            message: 'Message deleted successfully',
            data: populatedMessage
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};
