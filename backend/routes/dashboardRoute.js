import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/stats', adminAuth, getDashboardStats);

export default router;