import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Orders are strictly authenticated

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:orderId', getOrderById);
router.post('/:orderId/cancel', cancelOrder);

// Admin-only order status transition
router.put('/:orderId/status', adminOnly, updateOrderStatus);

export default router;
