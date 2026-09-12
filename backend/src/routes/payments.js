import express from 'express';
import {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPaymentAndCreateOrder);

export default router;
