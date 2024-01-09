import express from 'express';
import dotenv from "dotenv";
import { getConversation, createConversation, createGroupConversation, createMessage, readMessages, deleteConversation } from '../controllers/conversationController.js';

const router = express.Router();
dotenv.config();

router.get("/:conversationId", getConversation);
router.post("/create-conversation", createConversation);
router.post("/create-group-conversation", createGroupConversation);
router.post("/create-message/:conversationId", createMessage);
router.put("/read-conversation/:conversationId", readMessages);
router.put("/user/:userId/removeConversation/:conversationId", deleteConversation);

export default router;