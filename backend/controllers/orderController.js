import orderModel from '../models/orderModel.js';
import cartModel from '../models/cartModel.js';
import productModel from '../models/productModel.js';
import cloudinary from '../configs/cloudinary.js';
import mongoose from 'mongoose';
import userModel from '../models/userModel.js';
import { sendFCMNotification } from '../configs/firebase.js';
import adminTokenModel from '../models/adminTokenModel.js';

// Generate order number function (also in controller as backup)
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}${month}${day}-${random}`;
};

export const placeOrder = async (req, res) => {
  try {
    const { 
      items, 
      amount, 
      paymentMethod, 
      paymentProof,
      paymentMethodDetails,
      isDirectBuy = false 
    } = req.body;
    
    const userId = req.user.id;

    // Check if user exists and is active
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact support to place orders.'
      });
    }

    // Check if payment method is COD
    const isCOD = paymentMethod === 'Cash on Delivery';
    
    // For COD, we don't need a screenshot
    let screenshotUrl = '';
    
    if (!isCOD) {
      if (!paymentProof) {
        return res.status(400).json({
          success: false,
          message: 'Payment screenshot is required'
        });
      }
      
      try {
        const result = await cloudinary.uploader.upload(paymentProof, {
          folder: 'gaming-store/payments'
        });
        screenshotUrl = result.secure_url;
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: 'Failed to upload payment proof'
        });
      }
    } else {
      screenshotUrl = 'cod-payment';
    }

    // Validate items
    const validatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      // Check if product exists and is in stock for non-subscription items
      if (!item.isSubscription && item.productId) {
        const product = await productModel.findById(item.productId);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product "${item.name}" no longer exists`
          });
        }
        if (!product.inStock) {
          return res.status(400).json({
            success: false,
            message: `Product "${item.name}" is out of stock`
          });
        }
      }

      // Calculate total amount
      totalAmount += item.price * item.quantity;
      
      validatedItems.push({
        productId: item.productId || null,
        subscriptionId: item.subscriptionId || null,
        name: item.name,
        variant: item.variant || null,
        quantity: item.quantity,
        price: item.price,
        categoryId: item.categoryId || null,
        categorySlug: item.categorySlug || '',
        isSubscription: item.isSubscription || false,
        variantLabel: item.variantLabel || null,
        duration: item.duration || null,
        deliveryDetails: item.deliveryDetails || {}
      });
    }

    // Create order - manually generate order number
    const order = new orderModel({
      userId,
      items: validatedItems,
      amount: totalAmount || amount,
      paymentMethod,
      paymentProof: {
        screenshotUrl,
        uploadedAt: new Date()
      },
      paymentMethodDetails: paymentMethodDetails || {},
      orderNumber: generateOrderNumber(),
      status: isCOD ? 'Payment Verified' : 'Pending Verification'
    });

    await order.save();

    // If not direct buy, clear the cart
    if (!isDirectBuy) {
      const cart = await cartModel.findOne({ userId });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
    }

    // Trigger FCM Notification for New Order
    try {
      const adminTokenDoc = await adminTokenModel.findOne({});
      
      if (adminTokenDoc && adminTokenDoc.fcmToken) {
        await sendFCMNotification(
          adminTokenDoc.fcmToken,
          "New Order Received!",
          `Order #${order.orderNumber} was placed.`
        );
      } else {
        console.log("Skipping order notification: No active admin token saved in database.");
      }
    } catch (notificationError) {
      console.error("Failed to send order push notification:", notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all orders (admin)
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await orderModel.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await orderModel.countDocuments(filter);
    
    res.json({
      success: true,
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update order status (admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const order = await orderModel.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    ).populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get single order
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }
    
    // Find the order with populated user data
    const order = await orderModel.findById(id)
      .populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    res.json({ 
      success: true, 
      order 
    });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order details',
      error: error.message 
    });
  }
};

// Cancel order (User)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, note } = req.body;
    const userId = req.user.id;

    const order = await orderModel.findOne({ _id: id, userId });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    const cancellableStatuses = ['Pending Verification'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    order.status = 'Cancelled';
    order.cancellationRequested = true;
    order.cancellationReason = reason || 'Other';
    order.cancellationNote = note || '';
    order.cancelledAt = new Date();
    order.refundStatus = 'Pending';

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Refund order (Admin)
export const refundOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    if (order.status !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled orders can be refunded'
      });
    }

    if (order.refundStatus === 'Refunded') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been refunded'
      });
    }

    order.refundStatus = 'Refunded';
    await order.save();

    res.json({
      success: true,
      message: 'Order refunded successfully',
      order
    });
  } catch (error) {
    console.error('Refund order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get cancelled orders (Admin)
export const getCancelledOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await orderModel.find({ status: 'Cancelled' })
      .populate('userId', 'name email')
      .sort({ cancelledAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await orderModel.countDocuments({ status: 'Cancelled' });

    res.json({
      success: true,
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get cancelled orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const filter = { userId };
    if (status && status !== 'all') filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get orders with pagination
    const orders = await orderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await orderModel.countDocuments(filter);
    
    // Calculate total spent ONLY from Delivered and Payment Verified orders
    const allUserOrders = await orderModel.find({ 
      userId,
      status: { $in: ['Delivered', 'Payment Verified'] }
    });
    
    const totalSpent = allUserOrders.reduce((sum, order) => {
      return sum + (order.amount || 0);
    }, 0);
    
    // Get total orders count (all statuses)
    const totalOrdersCount = await orderModel.countDocuments({ userId });
    
    res.json({
      success: true,
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      user: {
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        totalSpent: totalSpent,
        totalOrders: totalOrdersCount
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user orders',
      error: error.message
    });
  }
};