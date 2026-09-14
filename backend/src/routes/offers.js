import express from 'express';
import { validateOffer } from '../controllers/offerController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public / Authenticated coupon validation for cart and checkout
router.post('/validate', optionalAuth, validateOffer);

export default router;
