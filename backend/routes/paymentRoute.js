import express from 'express';
import {
  getAllPaymentMethods,
  getActivePaymentMethods,
  upsertPaymentMethod,
  deletePaymentMethod
} from '../controllers/paymentController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/', getAllPaymentMethods);
router.get('/active', getActivePaymentMethods);
router.post('/', adminAuth, upsertPaymentMethod);
router.delete('/:name', adminAuth, deletePaymentMethod);

export default router;