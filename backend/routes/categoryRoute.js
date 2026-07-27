import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', adminAuth, createCategory);
router.put('/:id', adminAuth, updateCategory);
router.delete('/:id', adminAuth, deleteCategory);

// Optional: Cleanup orphaned images route (admin only)
router.post('/cleanup', adminAuth, async (req, res) => {
  try {
    // Get all categories
    const categories = await categoryModel.find();
    const validImageUrls = categories
      .map(c => c.image)
      .filter(url => url && url.startsWith('http'));
    
    // Get all images from Cloudinary folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'gaming-store/categories',
      max_results: 500
    });
    
    const cloudinaryPublicIds = result.resources.map(r => r.public_id);
    const validPublicIds = validImageUrls.map(url => extractPublicId(url)).filter(id => id);
    
    // Find orphaned images
    const orphanedIds = cloudinaryPublicIds.filter(id => !validPublicIds.includes(id));
    
    // Delete orphaned images
    const deleted = [];
    for (const id of orphanedIds) {
      try {
        await cloudinary.uploader.destroy(id);
        deleted.push(id);
        console.log(`Deleted orphaned image: ${id}`);
      } catch (error) {
        console.error(`Failed to delete ${id}:`, error);
      }
    }
    
    res.json({
      success: true,
      message: `Cleaned up ${deleted.length} orphaned images`,
      deleted
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;