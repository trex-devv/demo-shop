import productModel from '../models/productModel.js';
import cloudinary from '../configs/cloudinary.js';

// Get all products with filters
export const getAllProducts = async (req, res) => {
  try {
    const { category, subCategory, limit = 20, page = 1 } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await productModel.find(filter)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await productModel.countDocuments(filter);
    
    res.json({
      success: true,
      products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create product
export const createProduct = async (req, res) => {
  try {
    const { images, ...productData } = req.body;
    
    let uploadedImages = [];
    if (images && images.length > 0) {
      for (const image of images) {
        try {
          const result = await cloudinary.uploader.upload(image, {
            folder: 'gaming-store/products',
            transformation: [
              { width: 500, height: 500, crop: 'limit', quality: 'auto' }
            ]
          });
          uploadedImages.push({
            public_id: result.public_id,
            secure_url: result.secure_url
          });
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(400).json({ 
            success: false, 
            message: 'Failed to upload image: ' + uploadError.message 
          });
        }
      }
    }
    
    const product = new productModel({
      ...productData,
      images: uploadedImages
    });
    
    await product.save();
    
    // Populate the product before sending response
    const populatedProduct = await productModel.findById(product._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');
    
    res.status(201).json({ 
      success: true, 
      message: 'Product created successfully!',
      product: populatedProduct 
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { images, ...updateData } = req.body;
    
    // Get existing product
    const existingProduct = await productModel.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Handle image updates
    let finalImages = [];
    
    if (images && images.length > 0) {
      // Separate images into URLs (existing) and base64 (new)
      const existingImageUrls = images.filter(img => img.startsWith('http'));
      const newImageBase64 = images.filter(img => img.startsWith('data:image'));
      
      // Find images that were removed
      const currentImageUrls = existingProduct.images.map(img => img.secure_url);
      const removedImageUrls = currentImageUrls.filter(url => !existingImageUrls.includes(url));
      
      // Delete removed images from Cloudinary
      if (removedImageUrls.length > 0) {
        for (const removedUrl of removedImageUrls) {
          const imageToDelete = existingProduct.images.find(img => img.secure_url === removedUrl);
          if (imageToDelete) {
            try {
              await cloudinary.uploader.destroy(imageToDelete.public_id);
            } catch (deleteError) {
            }
          }
        }
      }
      
      // Keep existing images that are still in the list
      const keptImages = existingProduct.images.filter(img => 
        existingImageUrls.includes(img.secure_url)
      );
      finalImages = [...keptImages];
      
      // Upload new images
      if (newImageBase64.length > 0) {
        for (const image of newImageBase64) {
          try {
            const result = await cloudinary.uploader.upload(image, {
              folder: 'gaming-store/products',
              transformation: [
                { width: 500, height: 500, crop: 'limit', quality: 'auto' }
              ]
            });
            finalImages.push({
              public_id: result.public_id,
              secure_url: result.secure_url
            });
          } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return res.status(400).json({ 
              success: false, 
              message: 'Failed to upload image: ' + uploadError.message 
            });
          }
        }
      }
    } else {
      if (existingProduct.images && existingProduct.images.length > 0) {
        for (const img of existingProduct.images) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (deleteError) {
          }
        }
      }
      finalImages = [];
    }
    
    // Update the product with new images
    updateData.images = finalImages;
    
    const product = await productModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Populate the product before sending response
    const populatedProduct = await productModel.findById(product._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');
    
    res.json({ 
      success: true, 
      message: 'Product updated successfully!',
      product: populatedProduct 
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        try {
          await cloudinary.uploader.destroy(img.public_id);
        } catch (deleteError) {
          console.error('Cloudinary delete error:', deleteError);
        }
      }
    }
    
    await productModel.findByIdAndDelete(req.params.id);
    res.json({ 
      success: true, 
      message: 'Product deleted successfully',
      imagesDeleted: product.images.length > 0 
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};