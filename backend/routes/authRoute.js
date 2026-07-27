import express from 'express';
import { register, login, getProfile, adminLogin, updateProfile } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin', adminLogin);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

export default router;