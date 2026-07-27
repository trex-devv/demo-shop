import express from 'express';
import {
  createTicket,
  getUserTickets,
  getTicketById,
  getAllTickets,
  getTicketForAdmin,
  updateTicketStatus,
  getTicketStats,
  getTicketsByOrder
} from '../controllers/ticketController.js';
import { auth } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// User routes
router.post('/', auth, createTicket);
router.get('/my-tickets', auth, getUserTickets);
router.get('/:id', auth, getTicketById);

// Admin routes
router.get('/admin/all', adminAuth, getAllTickets);
router.get('/admin/stats', adminAuth, getTicketStats);
router.get('/admin/:id', adminAuth, getTicketForAdmin);
router.put('/admin/:id/status', adminAuth, updateTicketStatus);
router.get('/admin/order/:orderId', adminAuth, getTicketsByOrder);

export default router;