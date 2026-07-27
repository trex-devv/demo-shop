// backend/controllers/subscriptionController.js
import subscriptionModel from '../models/subscriptionModel.js';
import cloudinary from '../configs/cloudinary.js';

// Helper to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Get all subscriptions
export const getAllSubscriptions = async (req, res) => {
  try {
    const { category, isActive, limit = 20, page = 1 } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const subscriptions = await subscriptionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await subscriptionModel.countDocuments(filter);
    
    res.json({
      success: true,
      subscriptions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single subscription by ID
export const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionModel.findById(id);
    
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found' 
      });
    }
    
    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get subscription by slug
export const getSubscriptionBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const subscription = await subscriptionModel.findOne({ slug });
    
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found' 
      });
    }
    
    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Get subscription by slug error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create subscription
export const createSubscription = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      category, 
      variants, 
      features, 
      isActive, 
      isPopular, 
      provider, 
      providerWebsite,
      images 
    } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription name is required' 
      });
    }
    
    if (!variants || variants.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one variant is required' 
      });
    }
    
    // Validate variants
    for (const variant of variants) {
      if (!variant.label || !variant.label.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Variant label is required' 
        });
      }
      if (!variant.price || variant.price <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Valid variant price is required' 
        });
      }
      if (!variant.duration) {
        return res.status(400).json({ 
          success: false, 
          message: 'Variant duration is required' 
        });
      }
    }
    
    // Generate slug
    const slug = generateSlug(name);
    const existing = await subscriptionModel.findOne({ slug });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'A subscription with this name already exists' 
      });
    }
    
    // Process images
    let uploadedImages = [];
    if (images && images.length > 0) {
      for (const image of images) {
        if (image.startsWith('data:image')) {
          try {
            const result = await cloudinary.uploader.upload(image, {
              folder: 'gaming-store/subscriptions',
              transformation: [
                { width: 400, height: 400, crop: 'limit', quality: 'auto' }
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
        } else if (typeof image === 'string' && image.startsWith('http')) {
          uploadedImages.push({
            public_id: '',
            secure_url: image
          });
        }
      }
    }
    
    // Process variants - ensure durationLabel is set
    const processedVariants = variants.map(v => ({
      label: v.label.trim(),
      price: parseFloat(v.price),
      duration: v.duration,
      durationLabel: v.durationLabel || v.label
    }));
    
    const subscription = new subscriptionModel({
      name: name.trim(),
      slug,
      description: description || '',
      category: category || 'Other',
      variants: processedVariants,
      features: features || [],
      images: uploadedImages,
      isActive: isActive !== undefined ? isActive : true,
      isPopular: isPopular || false,
      provider: provider || '',
      providerWebsite: providerWebsite || ''
    });
    
    await subscription.save();
    
    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update subscription
export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      category, 
      variants, 
      features, 
      isActive, 
      isPopular, 
      provider, 
      providerWebsite,
      images 
    } = req.body;
    
    const existingSubscription = await subscriptionModel.findById(id);
    if (!existingSubscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found' 
      });
    }
    
    // Validate variants if provided
    if (variants && variants.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one variant is required' 
      });
    }
    
    if (variants) {
      for (const variant of variants) {
        if (!variant.label || !variant.label.trim()) {
          return res.status(400).json({ 
            success: false, 
            message: 'Variant label is required' 
          });
        }
        if (!variant.price || variant.price <= 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Valid variant price is required' 
          });
        }
        if (!variant.duration) {
          return res.status(400).json({ 
            success: false, 
            message: 'Variant duration is required' 
          });
        }
      }
    }
    
    // Handle slug if name changed
    let slug = existingSubscription.slug;
    if (name && name !== existingSubscription.name) {
      slug = generateSlug(name);
      const slugExists = await subscriptionModel.findOne({ 
        slug, 
        _id: { $ne: id } 
      });
      if (slugExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'A subscription with this name already exists' 
        });
      }
    }
    
    // Handle images
    let uploadedImages = existingSubscription.images;
    if (images && images.length > 0) {
      // Delete old images if new ones are uploaded
      if (existingSubscription.images && existingSubscription.images.length > 0) {
        for (const img of existingSubscription.images) {
          if (img.public_id) {
            try {
              await cloudinary.uploader.destroy(img.public_id);
            } catch (deleteError) {
              console.error('Cloudinary delete error:', deleteError);
            }
          }
        }
      }
      
      uploadedImages = [];
      for (const image of images) {
        if (image.startsWith('data:image')) {
          try {
            const result = await cloudinary.uploader.upload(image, {
              folder: 'gaming-store/subscriptions',
              transformation: [
                { width: 400, height: 400, crop: 'limit', quality: 'auto' }
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
        } else if (typeof image === 'string' && image.startsWith('http')) {
          uploadedImages.push({
            public_id: '',
            secure_url: image
          });
        }
      }
    }
    
    // Process variants
    let processedVariants = existingSubscription.variants;
    if (variants) {
      processedVariants = variants.map(v => ({
        label: v.label.trim(),
        price: parseFloat(v.price),
        duration: v.duration,
        durationLabel: v.durationLabel || v.label
      }));
    }
    
    const updateData = {
      name: name || existingSubscription.name,
      slug,
      description: description !== undefined ? description : existingSubscription.description,
      category: category || existingSubscription.category,
      variants: processedVariants,
      features: features !== undefined ? features : existingSubscription.features,
      images: uploadedImages,
      isActive: isActive !== undefined ? isActive : existingSubscription.isActive,
      isPopular: isPopular !== undefined ? isPopular : existingSubscription.isPopular,
      provider: provider !== undefined ? provider : existingSubscription.provider,
      providerWebsite: providerWebsite !== undefined ? providerWebsite : existingSubscription.providerWebsite
    };
    
    const subscription = await subscriptionModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete subscription
export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscription = await subscriptionModel.findById(id);
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found' 
      });
    }
    
    // Delete images from Cloudinary
    if (subscription.images && subscription.images.length > 0) {
      for (const img of subscription.images) {
        if (img.public_id) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (deleteError) {
            console.error('Cloudinary delete error:', deleteError);
          }
        }
      }
    }
    
    await subscriptionModel.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get subscription categories
export const getSubscriptionCategories = async (req, res) => {
  try {
    const categories = [
      { value: 'Streaming', label: 'Streaming' },
      { value: 'Gaming', label: 'Gaming' },
      { value: 'Shopping', label: 'Shopping' },
      { value: 'Music', label: 'Music' },
      { value: 'Productivity', label: 'Productivity' },
      { value: 'Other', label: 'Other' }
    ];
    
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get duration options for variants
export const getDurationOptions = async (req, res) => {
  try {
    const durations = [
      { value: 'monthly', label: 'Monthly' },
      { value: '3-months', label: '3 Months' },
      { value: '6-months', label: '6 Months' },
      { value: 'yearly', label: 'Yearly' }
    ];
    
    res.json({ success: true, durations });
  } catch (error) {
    console.error('Get durations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};