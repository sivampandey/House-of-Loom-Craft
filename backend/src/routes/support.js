import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMyTicketsCustomer,
  getTicketByIdCustomer,
  createTicketCustomer,
  addTicketCustomerMessage
} from '../controllers/supportController.js';

const router = express.Router();

// Strict authentication middleware: customer endpoints require valid authenticated session
router.use(protect);

// Customer support ticket endpoints
router.get('/tickets', getMyTicketsCustomer);
router.get('/tickets/:id', getTicketByIdCustomer);
router.post('/tickets', createTicketCustomer);
router.post('/tickets/:id/messages', addTicketCustomerMessage);

export default router;
