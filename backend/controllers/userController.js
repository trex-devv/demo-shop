import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';

// Get all users with order counts
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await userModel.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await userModel.countDocuments(filter);
    
    // Get order counts for each user
    const usersWithOrders = await Promise.all(users.map(async (user) => {
      const orders = await orderModel.find({ userId: user._id });
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const lastOrder = orders.length > 0 ? orders[orders.length - 1] : null;
      
      return {
        ...user.toObject(),
        totalOrders,
        totalSpent,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null
      };
    }));
    
    res.json({
      success: true,
      users: usersWithOrders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single user with their orders
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await userModel.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const orders = await orderModel.find({ userId: id })
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name');
    
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        totalOrders,
        totalSpent,
        orders
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user status (active/inactive)
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const user = await userModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};