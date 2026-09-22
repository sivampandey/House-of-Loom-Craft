import express from 'express';
import { getCurrencyData } from '../services/currencyService.js';

const router = express.Router();

/**
 * @route GET /api/currency/rates
 * @desc Get available currencies, flags, and authoritative exchange rates relative to INR
 * @access Public
 */
router.get('/rates', async (req, res, next) => {
  try {
    const data = await getCurrencyData();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
