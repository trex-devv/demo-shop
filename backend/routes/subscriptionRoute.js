import express from 'express';
import {
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionBySlug,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionCategories,
  getDurationOptions
} from '../controllers/subscriptionController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.get('/', getAllSubscriptions);
router.get('/categories', getSubscriptionCategories);
router.get('/durations', getDurationOptions);
router.get('/slug/:slug', getSubscriptionBySlug);
router.get('/:id', getSubscriptionById);

// Admin routes
router.post('/', adminAuth, createSubscription);
router.put('/:id', adminAuth, updateSubscription);
router.delete('/:id', adminAuth, deleteSubscription);

export default router;