import express from 'express';
import {
  placeOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  cancelOrder,
  refundOrder,
  getCancelledOrders
} from '../controllers/orderController.js';
import { auth } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// User routes
router.post('/place', auth, placeOrder);
router.get('/my-orders', auth, getUserOrders);
router.post('/:id/cancel', auth, cancelOrder);

// Admin routes
router.get('/all', adminAuth, getAllOrders);
router.get('/cancelled', adminAuth, getCancelledOrders);
router.put('/:id/status', adminAuth, updateOrderStatus);
router.put('/:id/refund', adminAuth, refundOrder);
router.get('/:id', adminAuth, getOrderById);

export default router;