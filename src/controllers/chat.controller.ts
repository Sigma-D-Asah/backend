import { Request, Response, NextFunction } from "express";
import { maintenanceAgent } from "../mastra/agents/maintenance-agent";
import { chatRateLimiter, chatBurstLimiter } from "../utils/rateLimiter";

/**
 * @swagger
 * /api/v1/chat:
 *   post:
 *     summary: Send a message to the Maintenance Copilot chatbot
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's natural language query
 *                 example: "What's the status of machine M001?"
 *               conversationId:
 *                 type: string
 *                 description: Optional conversation ID for maintaining context
 *                 example: "conv-123"
 *     responses:
 *       200:
 *         description: Chatbot response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                       description: Agent's response to the user query
 *                     conversationId:
 *                       type: string
 *                       description: Conversation ID for future context
 *       400:
 *         description: Bad request - missing or invalid parameters
 *       500:
 *         description: Internal server error
 */
export const chatController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { message, conversationId } = req.body;

        // Validate message
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: "Message is required and must be a non-empty string"
            });
        }

        // OPTIMIZED: Dual rate limiting (daily + burst protection)
        // Use IP address or user ID as key (here using IP for demo)
        const rateLimitKey = req.ip || 'default';
        
        // Check burst limit (10 per minute)
        const burstAllowed = await chatBurstLimiter.check(rateLimitKey);
        if (!burstAllowed) {
            return res.status(429).json({
                success: false,
                error: "Terlalu banyak permintaan. Mohon tunggu sebentar.",
                retryAfter: 60 // seconds
            });
        }
        
        // Check daily limit (50 per day)
        const dailyAllowed = await chatRateLimiter.check(rateLimitKey);
        if (!dailyAllowed) {
            const remaining = chatRateLimiter.getRemaining(rateLimitKey);
            return res.status(429).json({
                success: false,
                error: "Batas harian tercapai. Coba lagi besok.",
                retryAfter: 86400, // 24 hours in seconds
                remaining: 0
            });
        }

        // Generate or use existing conversation ID
            const currentConversationId = conversationId || `conv-${Date.now()}`;

            // Generate agent response with timeout protection
            const response = await maintenanceAgent.generate(message, {
                resourceId: currentConversationId,
            });        return res.status(200).json({
            success: true,
            data: {
                response: response.text,
                conversationId: currentConversationId,
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/chat/stream:
 *   post:
 *     summary: Send a message to the chatbot with streaming response
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's natural language query
 *               conversationId:
 *                 type: string
 *                 description: Optional conversation ID
 *     responses:
 *       200:
 *         description: Streaming response (text/event-stream)
 *       400:
 *         description: Bad request
 */
export const chatStreamController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { message, conversationId } = req.body;

        // Validate message
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: "Message is required and must be a non-empty string"
            });
        }

        // Set headers for SSE (Server-Sent Events)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const currentConversationId = conversationId || `conv-${Date.now()}`;

        try {
            // Stream agent response
            const stream = await maintenanceAgent.stream(message, {
                resourceId: currentConversationId,
            });

            // Send conversation ID first
            res.write(`data: ${JSON.stringify({ type: 'conversationId', data: currentConversationId })}\n\n`);

            // Stream response chunks
            for await (const chunk of stream.textStream) {
                res.write(`data: ${JSON.stringify({ type: 'chunk', data: chunk })}\n\n`);
            }

            // Send completion event
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            res.end();
        } catch (streamError: any) {
            // Handle streaming errors gracefully
            res.write(`data: ${JSON.stringify({ 
                type: 'error', 
                error: 'Terjadi kesalahan saat memproses permintaan Anda' 
            })}\n\n`);
            res.end();
        }
    } catch (error) {
        next(error);
    }
};
