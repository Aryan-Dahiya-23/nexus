import express from 'express';
import dotenv from "dotenv";
import { getConversation, createConversation, createGroupConversation, createMessage, readMessages, deleteConversation, getZegoToken } from '../controllers/conversationController.js';
import { ensureAuthenticated } from '../middleware/auth.js';

const router = express.Router();
dotenv.config();

// All conversation routes require authentication
router.use(ensureAuthenticated);

router.get("/zego-token/:roomId", getZegoToken);
router.get("/:conversationId", getConversation);
router.post("/create-conversation", createConversation);
router.post("/create-group-conversation", createGroupConversation);
router.post("/create-message/:conversationId", createMessage);
router.put("/read-conversation/:conversationId", readMessages);
router.put("/user/:userId/removeConversation/:conversationId", deleteConversation);

export default router;
