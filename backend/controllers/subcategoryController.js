import subcategoryModel from '../models/subcategoryModel.js';
import productModel from '../models/productModel.js';
import cloudinary from '../configs/cloudinary.js';

// Get all subcategories
export const getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await subcategoryModel.find()
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });
    res.json({ success: true, subcategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get subcategories by category
export const getSubcategoriesByCategory = async (req, res) => {
  try {
    const subcategories = await subcategoryModel.find({ 
      category: req.params.categoryId 
    }).sort({ createdAt: -1 });
    res.json({ success: true, subcategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create subcategory
export const createSubcategory = async (req, res) => {
  try {
    const { name, slug, category, image } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subcategory name is required' 
      });
    }
    
    if (!category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category is required' 
      });
    }
    
    // Generate slug if not provided
    let finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    // Check if slug already exists
    const existing = await subcategoryModel.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slug already exists. Please use a different slug.' 
      });
    }
    
    // Upload image to Cloudinary if provided
    let imageUrl = '';
    if (image && image.startsWith('data:image')) {
      try {
        const result = await cloudinary.uploader.upload(image, {
          folder: 'gaming-store/subcategories',
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

    const subcategory = new subcategoryModel({ 
      name: name.trim(), 
      slug: finalSlug,
      category,
      image: imageUrl
    });
    
    await subcategory.save();
    const populated = await subcategory.populate('category', 'name slug');
    res.status(201).json({ success: true, subcategory: populated });
  } catch (error) {
    console.error('Create subcategory error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update subcategory
export const updateSubcategory = async (req, res) => {
  try {
    const { name, slug, category, image } = req.body;
    const { id } = req.params;
    
    const existingSubcategory = await subcategoryModel.findById(id);
    if (!existingSubcategory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subcategory not found' 
      });
    }
    
    // Check if slug already exists (if changing)
    let finalSlug = existingSubcategory.slug;
    if (slug && slug !== existingSubcategory.slug) {
      finalSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const slugExists = await subcategoryModel.findOne({ 
        slug: finalSlug, 
        _id: { $ne: id } 
      });
      if (slugExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Slug already exists. Please use a different slug.' 
        });
      }
    }
    
    let imageUrl = existingSubcategory.image;
    
    // Handle image update
    if (image) {
      if (image.startsWith('data:image')) {
        // Delete old image from Cloudinary
        if (existingSubcategory.image) {
          try {
            const publicId = existingSubcategory.image.split('/').pop()?.split('.')[0];
            if (publicId) {
              await cloudinary.uploader.destroy(`gaming-store/subcategories/${publicId}`);
            }
          } catch (deleteError) {
            console.error('Cloudinary delete error:', deleteError);
          }
        }
        
        // Upload new image
        try {
          const result = await cloudinary.uploader.upload(image, {
            folder: 'gaming-store/subcategories',
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
      } else if (image.startsWith('http')) {
        imageUrl = image;
      } else if (image === '') {
        // Remove image - delete from Cloudinary
        if (existingSubcategory.image) {
          try {
            const publicId = existingSubcategory.image.split('/').pop()?.split('.')[0];
            if (publicId) {
              await cloudinary.uploader.destroy(`gaming-store/subcategories/${publicId}`);
            }
          } catch (deleteError) {
            console.error('Cloudinary delete error:', deleteError);
          }
        }
        imageUrl = '';
      }
    }

    const subcategory = await subcategoryModel.findByIdAndUpdate(
      id,
      {
        name: name || existingSubcategory.name,
        slug: finalSlug,
        category: category || existingSubcategory.category,
        image: imageUrl
      },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');
    
    if (!subcategory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subcategory not found' 
      });
    }
    
    res.json({ success: true, subcategory });
  } catch (error) {
    console.error('Update subcategory error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete subcategory
export const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if products exist
    const products = await productModel.find({ subCategory: id });
    if (products.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete subcategory. ${products.length} product(s) still reference it.` 
      });
    }
    
    const subcategory = await subcategoryModel.findById(id);
    if (!subcategory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subcategory not found' 
      });
    }
    
    // Delete image from Cloudinary
    if (subcategory.image) {
      try {
        const publicId = subcategory.image.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`gaming-store/subcategories/${publicId}`);
        }
      } catch (deleteError) {
        console.error('Cloudinary delete error:', deleteError);
      }
    }
    
    await subcategoryModel.findByIdAndDelete(id);
    res.json({ success: true, message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};