import mongoose from 'mongoose';
import cartModel from '../models/cartModel.js';
import productModel from '../models/productModel.js';

// Get user's cart
export const getCart = async (req, res) => {
  try {
    let cart = await cartModel.findOne({ userId: req.user.id });
    
    if (!cart) {
      cart = new cartModel({ userId: req.user.id, items: [] });
      await cart.save();
    }
    
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({
      success: true,
      cart,
      summary: { subtotal, totalItems }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get cart count
export const getCartCount = async (req, res) => {
  try {
    const cart = await cartModel.findOne({ userId: req.user.id });
    if (!cart) {
      return res.json({ success: true, count: 0 });
    }
    
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    res.json({ success: true, count: totalItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add to cart (for products)
export const addToCart = async (req, res) => {
  try {
    const { 
      productId, 
      variant, 
      quantity = 1,
      deliveryDetails = {},
      categoryId,
      categorySlug
    } = req.body;
    const userId = req.user.id;
    
    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    if (quantity > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum quantity per item is 10'
      });
    }
    
    // Get product
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Check if product is in stock
    if (!product.inStock) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product is out of stock' 
      });
    }
    
    // Get price based on pricing type
    let price;
    
    if (product.pricingType === 'variants' && variant) {
      const selectedVariant = product.variants.find(v => v.label === variant);
      if (!selectedVariant) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid variant' 
        });
      }
      price = selectedVariant.price;
    } else if (product.pricingType === 'flat') {
      price = product.price;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product pricing' 
      });
    }
    
    // Get category info
    const catId = categoryId || product.category;
    const catSlug = categorySlug || product.category?.slug;
    
    // Get or create cart
    let cart = await cartModel.findOne({ userId });
    if (!cart) {
      cart = new cartModel({ userId, items: [] });
    }
    
    // Prepare delivery details
    const deliveryDetailsToSave = {
      fields: deliveryDetails.fields || {},
      isSubscription: false,
      contactEmail: deliveryDetails.contactEmail || '',
      contactPhone: deliveryDetails.contactPhone || ''
    };
    
    // Check if item already exists with same variant and delivery details
    const existingItemIndex = cart.items.findIndex(
      item => item.productId && 
              item.productId.toString() === productId && 
              item.variant === (variant || null) &&
              JSON.stringify(item.deliveryDetails?.fields) === JSON.stringify(deliveryDetailsToSave.fields)
    );
    
    if (existingItemIndex > -1) {
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 items per product'
        });
      }
      
      existingItem.quantity = newQuantity;
      existingItem.price = price;
    } else {
      cart.items.push({
        productId,
        variant: variant || null,
        quantity,
        price,
        name: product.name,
        categoryId: catId,
        categorySlug: catSlug,
        deliveryDetails: deliveryDetailsToSave,
        isSubscription: false
      });
    }
    
    await cart.save();
    
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({
      success: true,
      cart,
      summary: { subtotal, totalItems }
    });
  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Add subscription to cart
export const addSubscriptionToCart = async (req, res) => {
  try {
    const { 
      subscriptionId, 
      variant, 
      quantity = 1,
      deliveryDetails = {},
      name,
      price,
      variantLabel,
      duration
    } = req.body;
    const userId = req.user.id;
    
    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    if (quantity > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum quantity per item is 10'
      });
    }
    
    // Validate subscriptionId
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }
    
    // Get or create cart
    let cart = await cartModel.findOne({ userId });
    if (!cart) {
      cart = new cartModel({ userId, items: [] });
    }
    
    // Prepare delivery details
    const deliveryDetailsToSave = {
      fields: deliveryDetails.fields || {},
      isSubscription: true,
      contactEmail: deliveryDetails.contactEmail || '',
      contactPhone: deliveryDetails.contactPhone || ''
    };
    
    // Check if same subscription with same variant exists
    const existingItemIndex = cart.items.findIndex(
      item => item.subscriptionId === subscriptionId && 
              item.variant === variant &&
              JSON.stringify(item.deliveryDetails?.fields) === JSON.stringify(deliveryDetailsToSave.fields)
    );
    
    if (existingItemIndex > -1) {
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 items per subscription'
        });
      }
      
      existingItem.quantity = newQuantity;
      existingItem.price = parseFloat(price);
    } else {
      cart.items.push({
        subscriptionId: subscriptionId,
        variant: variant || null,
        quantity,
        price: parseFloat(price),
        name: name || 'Subscription',
        categoryId: null,
        categorySlug: 'subscription',
        deliveryDetails: deliveryDetailsToSave,
        isSubscription: true,
        variantLabel: variantLabel || variant,
        duration: duration || 'monthly'
      });
    }
    
    await cart.save();
    
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({
      success: true,
      cart,
      summary: { subtotal, totalItems }
    });
  } catch (error) {
    console.error('Error in addSubscriptionToCart:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;
    
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }
    
    const cart = await cartModel.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    if (quantity === 0) {
      await cart.updateOne({ $pull: { items: { _id: itemId } } });
      const updatedCart = await cartModel.findOne({ userId });
      
      const subtotal = updatedCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalItems = updatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
      
      return res.json({
        success: true,
        cart: updatedCart,
        summary: { subtotal, totalItems }
      });
    }
    
    // Check if product is still in stock (only for products)
    if (item.productId) {
      const product = await productModel.findById(item.productId);
      if (product && !product.inStock) {
        return res.status(400).json({
          success: false,
          message: 'Product is out of stock'
        });
      }
    }
    
    item.quantity = quantity;
    await cart.save();
    
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({
      success: true,
      cart,
      summary: { subtotal, totalItems }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    
    const cart = await cartModel.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    await cart.updateOne({ $pull: { items: { _id: itemId } } });
    const updatedCart = await cartModel.findOne({ userId });
    
    const subtotal = updatedCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = updatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({
      success: true,
      cart: updatedCart,
      summary: { subtotal, totalItems }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await cartModel.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({
      success: true,
      cart,
      summary: { subtotal: 0, totalItems: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validate cart before checkout
export const validateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await cartModel.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }
    
    const validationResults = [];
    let isValid = true;
    let subtotal = 0;
    
    for (const item of cart.items) {
      // Skip validation for subscription items
      if (item.isSubscription) {
        subtotal += item.price * item.quantity;
        continue;
      }
      
      const product = await productModel.findById(item.productId);
      
      if (!product) {
        validationResults.push({
          itemId: item._id,
          productId: item.productId,
          name: item.name,
          error: 'Product no longer exists'
        });
        isValid = false;
        continue;
      }
      
      // Check if product is in stock
      if (!product.inStock) {
        validationResults.push({
          itemId: item._id,
          productId: item.productId,
          name: item.name,
          error: 'Product is out of stock'
        });
        isValid = false;
        continue;
      }
      
      // Check delivery details
      if (!item.deliveryDetails || Object.keys(item.deliveryDetails).length === 0) {
        validationResults.push({
          itemId: item._id,
          productId: item.productId,
          name: item.name,
          error: 'Delivery details missing'
        });
        isValid = false;
        continue;
      }
      
      let currentPrice;
      if (product.pricingType === 'variants' && item.variant) {
        const variant = product.variants.find(v => v.label === item.variant);
        if (!variant) {
          validationResults.push({
            itemId: item._id,
            productId: item.productId,
            name: item.name,
            variant: item.variant,
            error: 'Variant no longer exists'
          });
          isValid = false;
          continue;
        }
        currentPrice = variant.price;
      } else if (product.pricingType === 'flat') {
        currentPrice = product.price;
      } else {
        validationResults.push({
          itemId: item._id,
          productId: item.productId,
          name: item.name,
          error: 'Invalid pricing type'
        });
        isValid = false;
        continue;
      }
      
      // Update price if changed
      if (currentPrice !== item.price) {
        item.price = currentPrice;
        await cart.save();
      }
      
      subtotal += item.price * item.quantity;
    }
    
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({
      success: true,
      isValid,
      validationResults,
      summary: {
        itemCount: cart.items.length,
        totalItems,
        subtotal
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};