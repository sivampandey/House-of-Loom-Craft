import express from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductById,
  searchProducts,
  getCollections,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/collections', getCollections);
router.get('/id/:id', getProductById);
router.get('/:slug', getProductBySlug);

// Admin-only endpoints
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
