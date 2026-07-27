import express from 'express';
import { adminAuth, saveAdminFCMToken } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/save-token', adminAuth, saveAdminFCMToken);

export default router;