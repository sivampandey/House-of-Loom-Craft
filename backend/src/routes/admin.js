import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getDashboardStats,
  getAllProductsAdmin,
  getProductAdminById,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  getAllUsersAdmin,
  getUserAdminById,
  deleteUserAdmin,
  getAllOrdersAdmin,
  getOrderAdminById,
  updateOrderStatusAdmin,
  updateOrderTrackingAdmin
} from '../controllers/adminController.js';
import {
  getAllOffersAdmin,
  getOfferAdminById,
  createOfferAdmin,
  updateOfferAdmin,
  deleteOfferAdmin
} from '../controllers/offerController.js';

const router = express.Router();

// Enforce strict authentication and admin-only role check on ALL routes
router.use(protect);
router.use(adminOnly);

// ==================== DASHBOARD ====================
router.get('/dashboard', getDashboardStats);

// ==================== PRODUCTS ====================
router.get('/products', getAllProductsAdmin);
router.get('/products/:id', getProductAdminById);
router.post('/products', createProductAdmin);
router.put('/products/:id', updateProductAdmin);
router.delete('/products/:id', deleteProductAdmin);

// ==================== USERS ====================
router.get('/users', getAllUsersAdmin);
router.get('/users/:id', getUserAdminById);
router.delete('/users/:id', deleteUserAdmin);

// ==================== ORDERS ====================
router.get('/orders', getAllOrdersAdmin);
router.get('/orders/:id', getOrderAdminById);
router.put('/orders/:id/status', updateOrderStatusAdmin);
router.put('/orders/:id/tracking', updateOrderTrackingAdmin);

// ==================== OFFERS / COUPONS ====================
router.get('/offers', getAllOffersAdmin);
router.get('/offers/:id', getOfferAdminById);
router.post('/offers', createOfferAdmin);
router.put('/offers/:id', updateOfferAdmin);
router.delete('/offers/:id', deleteOfferAdmin);

export default router;
