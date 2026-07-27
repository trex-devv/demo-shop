// backend/routes/fieldRoutes.js
import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  getCategoryFields,
  updateCategory,
  deleteCategory,
  addFieldToCategory,
  updateFieldInCategory,
  deleteFieldFromCategory,
  reorderFields
} from '../controllers/fieldController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/fields/:categoryId', getCategoryFields);

// Admin routes (auth required)
router.get('/', adminAuth, getAllCategories);
router.get('/:id', adminAuth, getCategoryById);
router.put('/:id', adminAuth, updateCategory);
router.delete('/:id', adminAuth, deleteCategory);
router.post('/:id/fields', adminAuth, addFieldToCategory);
router.put('/:id/fields/:fieldId', adminAuth, updateFieldInCategory);
router.delete('/:id/fields/:fieldId', adminAuth, deleteFieldFromCategory);
router.post('/:id/fields/reorder', adminAuth, reorderFields);

export default router;