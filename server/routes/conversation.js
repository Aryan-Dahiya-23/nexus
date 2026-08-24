import express from 'express';
import dotenv from "dotenv";
import {
    getConversation,
    getConversationMessages,
    createConversation,
    createGroupConversation,
    createMessage,
    readMessages,
    deleteConversation,
    getZegoToken,
    editMessage,
    deleteMessage
} from '../controllers/conversationController.js';
import { ensureAuthenticated } from '../middleware/auth.js';

const router = express.Router();
dotenv.config();

// All conversation routes require authentication
router.use(ensureAuthenticated);

router.get("/zego-token/:roomId", getZegoToken);
router.get("/:conversationId/messages", getConversationMessages);
router.get("/:conversationId", getConversation);
router.post("/create-conversation", createConversation);
router.post("/create-group-conversation", createGroupConversation);
router.post("/create-message/:conversationId", createMessage);
router.put("/:conversationId/message/:messageId", editMessage);
router.delete("/:conversationId/message/:messageId", deleteMessage);
router.put("/read-conversation/:conversationId", readMessages);
router.put("/user/:userId/removeConversation/:conversationId", deleteConversation);

export default router;
