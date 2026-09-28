import express from 'express';
import {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
  handleRazorpayWebhook
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Razorpay server-to-server webhook (verified by HMAC-SHA256 signature, not user JWT)
router.post('/webhook', handleRazorpayWebhook);

// Protected routes (require user JWT authentication)
router.use(protect);

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPaymentAndCreateOrder);

export default router;
