import express from 'express';
import {
  getAllSubcategories,
  getSubcategoriesByCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
} from '../controllers/subcategoryController.js';
import { auth} from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/', getAllSubcategories);
router.get('/category/:categoryId', getSubcategoriesByCategory);
router.post('/', adminAuth, createSubcategory);
router.put('/:id', adminAuth, updateSubcategory);
router.delete('/:id', adminAuth, deleteSubcategory);

export default router;