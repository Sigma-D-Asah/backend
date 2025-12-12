import { Router } from "express";
import { chatController, chatStreamController } from "../controllers/chat.controller";

const router = Router();

/**
 * @route POST /api/v1/chat
 * @description Send a message to the Maintenance Copilot chatbot
 */
router.post("/chat", chatController);

/**
 * @route POST /api/v1/chat/stream
 * @description Send a message with streaming response
 */
router.post("/chat/stream", chatStreamController);

export const chatRouter = router;
