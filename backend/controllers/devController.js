// backend/controllers/devController.js
import Order from "../models/orderModel.js";
import Ticket from "../models/ticketModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const extractPublicId = (url) => {
  if (!url) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

const deleteFromCloudinary = async (url) => {
  if (!url) return;
  try {
    const publicId = extractPublicId(url);
    if (publicId) {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`Cloudinary delete result for ${publicId}:`, result);
      return result;
    }
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
};

const deleteOrderImages = async (order) => {
  try {
    if (order.paymentProof?.screenshotUrl) {
      await deleteFromCloudinary(order.paymentProof.screenshotUrl);
    }
    if (typeof order.paymentProof === 'string' && order.paymentProof) {
      await deleteFromCloudinary(order.paymentProof);
    }
  } catch (error) {
    console.error("Error deleting order images:", error);
  }
};

const deleteUserAvatar = async (user) => {
  try {
    if (user.avatar) {
      await deleteFromCloudinary(user.avatar);
    }
  } catch (error) {
    console.error("Error deleting user avatar:", error);
  }
};

const deleteTicketAttachments = async (ticket) => {
  try {
    if (ticket.attachments && Array.isArray(ticket.attachments)) {
      for (const attachment of ticket.attachments) {
        if (typeof attachment === 'string') {
          await deleteFromCloudinary(attachment);
        } else if (attachment.url) {
          await deleteFromCloudinary(attachment.url);
        }
      }
    }
  } catch (error) {
    console.error("Error deleting ticket attachments:", error);
  }
};

// ========================================
// ORDERS MANAGEMENT
// ========================================

export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 50, sort = '-createdAt' } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('userId', 'name email phone')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load orders",
      error: error.message
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error("Error in getOrderById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load order",
      error: error.message
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending Verification', 'Payment Verified', 'Payment Rejected', 'Delivered', 'Invalid Details', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      message: "Order status updated",
      data: order
    });
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message
    });
  }
};

export const deleteAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({});

    let imagesDeleted = 0;
    for (const order of orders) {
      await deleteOrderImages(order);
      imagesDeleted++;
    }

    const result = await Order.deleteMany({});

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} orders and their associated images`,
      deletedCount: result.deletedCount,
      imagesDeleted: imagesDeleted
    });
  } catch (error) {
    console.error("Error in deleteAllOrders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete orders",
      error: error.message
    });
  }
};

export const deleteRejectedOrders = async (req, res) => {
  try {
    const statuses = ['Payment Rejected', 'Cancelled', 'Invalid Details'];

    const orders = await Order.find({ status: { $in: statuses } });

    let imagesDeleted = 0;
    for (const order of orders) {
      await deleteOrderImages(order);
      imagesDeleted++;
    }

    const result = await Order.deleteMany({ status: { $in: statuses } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} rejected/cancelled orders and their images`,
      deletedCount: result.deletedCount,
      imagesDeleted: imagesDeleted
    });
  } catch (error) {
    console.error("Error in deleteRejectedOrders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete rejected orders",
      error: error.message
    });
  }
};

export const deleteDeliveredOrders = async (req, res) => {
  try {
    const statuses = ['Delivered'];

    const orders = await Order.find({ status: { $in: statuses } });

    let imagesDeleted = 0;
    for (const order of orders) {
      await deleteOrderImages(order);
      imagesDeleted++;
    }

    const result = await Order.deleteMany({ status: { $in: statuses } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} delivered orders and their images`,
      deletedCount: result.deletedCount,
      imagesDeleted: imagesDeleted
    });
  } catch (error) {
    console.error("Error in deleteDeliveredOrders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete delivered orders",
      error: error.message
    });
  }
};

export const deletePendingOrders = async (req, res) => {
  try {
    const statuses = ['Pending Verification', 'Payment Verified'];

    const orders = await Order.find({ status: { $in: statuses } });

    let imagesDeleted = 0;
    for (const order of orders) {
      await deleteOrderImages(order);
      imagesDeleted++;
    }

    const result = await Order.deleteMany({ status: { $in: statuses } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} pending orders and their images`,
      deletedCount: result.deletedCount,
      imagesDeleted: imagesDeleted
    });
  } catch (error) {
    console.error("Error in deletePendingOrders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete pending orders",
      error: error.message
    });
  }
};

export const deleteOrdersByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const orders = await Order.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    let imagesDeleted = 0;
    for (const order of orders) {
      await deleteOrderImages(order);
      imagesDeleted++;
    }

    const result = await Order.deleteMany({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} orders between ${startDate} and ${endDate}`,
      deletedCount: result.deletedCount,
      imagesDeleted: imagesDeleted
    });
  } catch (error) {
    console.error("Error in deleteOrdersByDate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete orders by date",
      error: error.message
    });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    await deleteOrderImages(order);
    await order.deleteOne();

    res.json({
      success: true,
      message: "Order deleted successfully with its images",
      data: order
    });
  } catch (error) {
    console.error("Error in deleteOrder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message
    });
  }
};

// ========================================
// TICKETS MANAGEMENT
// ========================================

export const getAllTickets = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 50, sort = '-createdAt' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tickets = await Ticket.find(filter)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber status amount')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Ticket.countDocuments(filter);

    res.json({
      success: true,
      data: tickets,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error in getAllTickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load tickets",
      error: error.message
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber status amount')
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error("Error in getTicketById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load ticket",
      error: error.message
    });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['Open', 'Hold', 'Resolved', 'Rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status"
      });
    }

    const updateData = {
      status,
      resolvedAt: status === 'Resolved' ? new Date() : null
    };

    if (adminNote !== undefined) {
      updateData.adminNote = adminNote;
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    res.json({
      success: true,
      message: "Ticket status updated",
      data: ticket
    });
  } catch (error) {
    console.error("Error in updateTicketStatus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
      error: error.message
    });
  }
};

export const deleteAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({});

    let attachmentsDeleted = 0;
    for (const ticket of tickets) {
      await deleteTicketAttachments(ticket);
      attachmentsDeleted++;
    }

    const result = await Ticket.deleteMany({});

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} tickets and their attachments`,
      deletedCount: result.deletedCount,
      attachmentsDeleted: attachmentsDeleted
    });
  } catch (error) {
    console.error("Error in deleteAllTickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete tickets",
      error: error.message
    });
  }
};

export const deleteResolvedTickets = async (req, res) => {
  try {
    const statuses = ['Resolved'];

    const tickets = await Ticket.find({ status: { $in: statuses } });

    let attachmentsDeleted = 0;
    for (const ticket of tickets) {
      await deleteTicketAttachments(ticket);
      attachmentsDeleted++;
    }

    const result = await Ticket.deleteMany({ status: { $in: statuses } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} resolved tickets and their attachments`,
      deletedCount: result.deletedCount,
      attachmentsDeleted: attachmentsDeleted
    });
  } catch (error) {
    console.error("Error in deleteResolvedTickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete resolved tickets",
      error: error.message
    });
  }
};

export const deletePendingTickets = async (req, res) => {
  try {
    const statuses = ['Open', 'Hold'];

    const tickets = await Ticket.find({ status: { $in: statuses } });

    let attachmentsDeleted = 0;
    for (const ticket of tickets) {
      await deleteTicketAttachments(ticket);
      attachmentsDeleted++;
    }

    const result = await Ticket.deleteMany({ status: { $in: statuses } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} pending tickets and their attachments`,
      deletedCount: result.deletedCount,
      attachmentsDeleted: attachmentsDeleted
    });
  } catch (error) {
    console.error("Error in deletePendingTickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete pending tickets",
      error: error.message
    });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    await deleteTicketAttachments(ticket);
    await ticket.deleteOne();

    res.json({
      success: true,
      message: "Ticket deleted successfully with its attachments",
      data: ticket
    });
  } catch (error) {
    console.error("Error in deleteTicket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
      error: error.message
    });
  }
};

// ========================================
// USERS MANAGEMENT
// ========================================

export const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 50, sort = '-createdAt' } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load users",
      error: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load user",
      error: error.message
    });
  }
};

export const deleteAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $nin: ['admin', 'developer'] } });

    let avatarsDeleted = 0;
    for (const user of users) {
      await deleteUserAvatar(user);
      avatarsDeleted++;
    }

    const result = await User.deleteMany({ role: { $nin: ['admin', 'developer'] } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} users and their avatars (admins and developers preserved)`,
      deletedCount: result.deletedCount,
      avatarsDeleted: avatarsDeleted
    });
  } catch (error) {
    console.error("Error in deleteAllUsers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete users",
      error: error.message
    });
  }
};

export const deleteInactiveUsers = async (req, res) => {
  try {
    const users = await User.find({
      isActive: false,
      role: { $nin: ['admin', 'developer'] }
    });

    let avatarsDeleted = 0;
    for (const user of users) {
      await deleteUserAvatar(user);
      avatarsDeleted++;
    }

    const result = await User.deleteMany({
      isActive: false,
      role: { $nin: ['admin', 'developer'] }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} inactive users and their avatars`,
      deletedCount: result.deletedCount,
      avatarsDeleted: avatarsDeleted
    });
  } catch (error) {
    console.error("Error in deleteInactiveUsers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete inactive users",
      error: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role === 'admin' || user.role === 'developer') {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin or developer accounts"
      });
    }

    await deleteUserAvatar(user);
    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully with their avatar",
      data: user
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'admin', 'manager'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires')
    .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User role updated",
      data: user
    });
  } catch (error) {
    console.error("Error in updateUserRole:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message
    });
  }
};

// ========================================
// DASHBOARD STATISTICS
// ========================================

export const getStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['Pending Verification', 'Payment Verified'] }
    });
    const deliveredOrders = await Order.countDocuments({
      status: { $in: ['Delivered'] }
    });
    const rejectedOrders = await Order.countDocuments({
      status: { $in: ['Payment Rejected', 'Cancelled', 'Invalid Details'] }
    });

    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({
      status: { $in: ['Open', 'Hold'] }
    });
    const resolvedTickets = await Ticket.countDocuments({
      status: { $in: ['Resolved'] }
    });

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          delivered: deliveredOrders,
          rejected: rejectedOrders
        },
        tickets: {
          total: totalTickets,
          open: openTickets,
          resolved: resolvedTickets
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          admin: adminUsers
        }
      }
    });
  } catch (error) {
    console.error("Error in getStats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load statistics",
      error: error.message
    });
  }
};

export const deleteAllData = async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Set confirm to "DELETE_ALL_DATA"'
      });
    }

    const orders = await Order.find({});
    const tickets = await Ticket.find({});
    const users = await User.find({ role: { $nin: ['admin', 'developer'] } });

    let orderImagesDeleted = 0;
    for (const order of orders) {
      await deleteOrderImages(order);
      orderImagesDeleted++;
    }

    let ticketAttachmentsDeleted = 0;
    for (const ticket of tickets) {
      await deleteTicketAttachments(ticket);
      ticketAttachmentsDeleted++;
    }

    let userAvatarsDeleted = 0;
    for (const user of users) {
      await deleteUserAvatar(user);
      userAvatarsDeleted++;
    }

    const ordersDeleted = await Order.deleteMany({});
    const ticketsDeleted = await Ticket.deleteMany({});
    const usersDeleted = await User.deleteMany({
      role: { $nin: ['admin', 'developer'] }
    });

    res.json({
      success: true,
      message: "All data deleted successfully",
      data: {
        ordersDeleted: ordersDeleted.deletedCount,
        ticketsDeleted: ticketsDeleted.deletedCount,
        usersDeleted: usersDeleted.deletedCount,
        orderImagesDeleted: orderImagesDeleted,
        ticketAttachmentsDeleted: ticketAttachmentsDeleted,
        userAvatarsDeleted: userAvatarsDeleted
      }
    });
  } catch (error) {
    console.error("Error in deleteAllData:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete all data",
      error: error.message
    });
  }
};
