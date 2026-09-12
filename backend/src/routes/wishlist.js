import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  syncWishlist
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Wishlist persistence is strictly protected

router.get('/', getWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.post('/sync', syncWishlist);

export default router;
