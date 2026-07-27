import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserStatus
} from '../controllers/userController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/', adminAuth, getAllUsers);
router.get('/:id', adminAuth, getUserById);
router.put('/:id/status', adminAuth, updateUserStatus);

export default router;