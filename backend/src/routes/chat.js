import express from 'express';
import rateLimit from 'express-rate-limit';
import { handleChat } from '../controllers/chatController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Dedicated rate limiter for AI Chatbot: 30 requests per 10 minutes
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many concierge inquiries. Please pause for a few minutes before sending more messages.'
  }
});

// Chat endpoint (supports optional authentication so logged-in users can query their orders securely)
router.post('/', chatLimiter, optionalAuth, handleChat);

export default router;
