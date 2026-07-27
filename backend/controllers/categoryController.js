import categoryModel from '../models/categoryModel.js';
import productModel from '../models/productModel.js';
import cloudinary from '../configs/cloudinary.js';

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find().sort({ createdAt: -1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single category
export const getCategoryById = async (req, res) => {
  try {
    const category = await categoryModel.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create category with Cloudinary image upload
export const createCategory = async (req, res) => {
  try {
    const { name, slug, image } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name is required' 
      });
    }
    
    if (!slug || !slug.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slug is required' 
      });
    }
    
    // Check if slug already exists
    const existing = await categoryModel.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slug already exists. Please use a different slug.' 
      });
    }

    let imageUrl = '';
    
    // Upload image to Cloudinary if provided
    if (image && image.startsWith('data:image')) {
      try {
        const result = await cloudinary.uploader.upload(image, {
          folder: 'gaming-store/categories',
          transformation: [
            { width: 400, height: 400, crop: 'limit', quality: 'auto' }
          ]
        });
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(400).json({ 
          success: false, 
          message: 'Failed to upload image. Please try again.' 
        });
      }
    }

    const category = new categoryModel({ 
      name: name.trim(), 
      slug: slug.toLowerCase().trim(),
      image: imageUrl 
    });
    
    await category.save();
    res.status(201).json({ 
      success: true, 
      message: 'Category created successfully!',
      category 
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join('. ')
      });
    }
    
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create category' 
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { name, slug, image } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name is required' 
      });
    }
    
    if (!slug || !slug.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slug is required' 
      });
    }
    
    let updateData = { 
      name: name.trim(), 
      slug: slug.toLowerCase().trim() 
    };
    
    // Handle image update
    if (image) {
      if (image.startsWith('data:image')) {
        try {
          // Get existing category to delete old image
          const existingCategory = await categoryModel.findById(req.params.id);
          
          // Delete old image from Cloudinary if exists
          if (existingCategory?.image) {
            const publicId = extractPublicId(existingCategory.image);
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          }
          
          // Upload new image
          const result = await cloudinary.uploader.upload(image, {
            folder: 'gaming-store/categories',
            transformation: [
              { width: 400, height: 400, crop: 'limit', quality: 'auto' }
            ]
          });
          updateData.image = result.secure_url;
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(400).json({ 
            success: false, 
            message: 'Failed to upload image. Please try again.' 
          });
        }
      } else if (image.startsWith('http')) {
        // Image is already a URL
        updateData.image = image;
      } else if (image === '') {
        // Remove image - delete from Cloudinary
        const existingCategory = await categoryModel.findById(req.params.id);
        if (existingCategory?.image) {
          const publicId = extractPublicId(existingCategory.image);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        }
        updateData.image = '';
      }
    }

    const category = await categoryModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Category updated successfully!',
      category 
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join('. ')
      });
    }
    
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to update category' 
    });
  }
};

// Delete category with Cloudinary image cleanup
export const deleteCategory = async (req, res) => {
  try {
    // Check if products exist
    const products = await productModel.find({ category: req.params.id });
    if (products.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category. ${products.length} product(s) still reference it.` 
      });
    }
    
    // Get category to delete image from Cloudinary
    const category = await categoryModel.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    // Delete image from Cloudinary if exists
    if (category.image) {
      const publicId = extractPublicId(category.image);
      if (publicId) {
        try {
          const result = await cloudinary.uploader.destroy(publicId);
          if (result.result === 'ok') {
          } else {
          }
        } catch (deleteError) {
        }
      }
    }
    
    // Delete category from database
    await categoryModel.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: 'Category deleted successfully',
      imageDeleted: !!category.image 
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete category' 
    });
  }
};

// Helper function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
  try {
    if (!url) return null;
    // Example URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/gaming-store/categories/filename.jpg
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Get the path after 'upload' and before the version number
    const pathParts = parts.slice(uploadIndex + 2); // Skip 'upload' and version
    const publicId = pathParts.join('/').split('.')[0]; // Remove extension
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};