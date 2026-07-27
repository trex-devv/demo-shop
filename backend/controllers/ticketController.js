import ticketModel from '../models/ticketModel.js';
import orderModel from '../models/orderModel.js';
import cloudinary from '../configs/cloudinary.js';
import { sendFCMNotification } from '../configs/firebase.js';
import adminTokenModel from '../models/adminTokenModel.js';

// Get priority based on ticket type
const getPriority = (type) => {
  const priorities = {
    'Item Not Delivered': 'Urgent',
    'Wrong Item Received': 'High',
    'Missing Items': 'High',
    'Delayed Delivery': 'Medium',
    'Wrong Details Submitted': 'Medium',
    'Items Not Received In-Game': 'Urgent',
    'Payment Not Verified': 'High',
    'Other': 'Low'
  };
  return priorities[type] || 'Medium';
};

// Create ticket (User)
export const createTicket = async (req, res) => {
  try {
    const { orderId, type, description, attachments } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Ticket type is required'
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    // Validate order exists and belongs to user
    const order = await orderModel.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or does not belong to you' 
      });
    }

    // Check if user already has 3 tickets for this order
    const ticketCount = await ticketModel.countDocuments({ 
      order: orderId
    });

    if (ticketCount >= 3) {
      return res.status(400).json({
        success: false,
        message: `You can only raise up to 3 tickets per order. You already have ${ticketCount} ticket(s).`
      });
    }

    // Process attachments
    let uploadedAttachments = [];
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.startsWith('data:image')) {
          try {
            const result = await cloudinary.uploader.upload(attachment, {
              folder: 'gaming-store/tickets',
              transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto' }
              ]
            });
            uploadedAttachments.push({
              url: result.secure_url,
              public_id: result.public_id,
              filename: attachment.name || 'attachment'
            });
          } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
          }
        }
      }
    }

    // Calculate priority based on type
    const priority = getPriority(type);

    const ticket = new ticketModel({
      user: userId,
      order: orderId,
      orderNumber: order.orderNumber || order._id.toString().slice(-8),
      type: type,
      description: description,
      attachments: uploadedAttachments,
      priority: priority,
      status: 'Open'
    });

    await ticket.save();

    // Trigger FCM Notification
    try {
      const adminTokenDoc = await adminTokenModel.findOne({});
      
      if (adminTokenDoc && adminTokenDoc.fcmToken) {
        await sendFCMNotification(
          adminTokenDoc.fcmToken,
          "New Support Ticket Raised!",
          `Type: ${type} (Order #${ticket.orderNumber})`
        );
      } else {
        console.log("Skipping ticket notification: No active admin token saved in database.");
      }
    } catch (notificationError) {
      console.error("Failed to send ticket push notification:", notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket,
      remainingTickets: 3 - (ticketCount + 1)
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create ticket'
    });
  }
};

// Get user's tickets
export const getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: userId };
    if (status) filter.status = status;

    const tickets = await ticketModel.find(filter)
      .populate('order', 'amount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ticketModel.countDocuments(filter);

    res.json({
      success: true,
      tickets,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch tickets'
    });
  }
};

// Get single ticket (User)
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticket = await ticketModel.findOne({ _id: id, user: userId })
      .populate('order', 'amount status');

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch ticket'
    });
  }
};

// ============ ADMIN CONTROLLERS ============

// Get all tickets (Admin)
export const getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await ticketModel.find(filter)
      .populate('user', 'name email')
      .populate('order', 'amount status')
      .sort({ priority: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ticketModel.countDocuments(filter);

    res.json({
      success: true,
      tickets,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch tickets'
    });
  }
};

// Get single ticket for admin
export const getTicketForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await ticketModel.findById(id)
      .populate('user', 'name email')
      .populate('order', 'amount status');

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Get all tickets for the same order to show history
    const orderTickets = await ticketModel.find({ 
      order: ticket.order,
      _id: { $ne: id }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      ticket,
      orderTickets
    });
  } catch (error) {
    console.error('Get ticket for admin error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch ticket'
    });
  }
};

// Update ticket status (Admin) - FIXED with Hold
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['Open', 'Hold', 'Resolved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: Open, Hold, Resolved, Rejected'
      });
    }

    const ticket = await ticketModel.findById(id);
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Build update data
    const updateData = { status };
    
    // Set resolvedAt when status changes to Resolved or Rejected
    if (status === 'Resolved' || status === 'Rejected') {
      updateData.resolvedAt = new Date();
    } else {
      // If reopening (Open or Hold), clear resolvedAt
      updateData.resolvedAt = null;
    }

    // Add admin note if provided
    if (adminNote !== undefined && adminNote !== null) {
      updateData.adminNote = adminNote.trim() || '';
    }

    const updatedTicket = await ticketModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email')
      .populate('order', 'amount status');

    res.json({
      success: true,
      message: `Ticket ${status.toLowerCase()} successfully`,
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update ticket status'
    });
  }
};

// Get ticket statistics (Admin)
export const getTicketStats = async (req, res) => {
  try {
    const total = await ticketModel.countDocuments();
    const open = await ticketModel.countDocuments({ status: 'Open' });
    const hold = await ticketModel.countDocuments({ status: 'Hold' });
    const resolved = await ticketModel.countDocuments({ status: 'Resolved' });
    const rejected = await ticketModel.countDocuments({ status: 'Rejected' });
    const urgent = await ticketModel.countDocuments({ 
      priority: 'Urgent', 
      status: { $in: ['Open', 'Hold'] }
    });

    res.json({
      success: true,
      stats: {
        total,
        open,
        hold,
        resolved,
        rejected,
        urgent
      }
    });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch stats'
    });
  }
};

// Get tickets for a specific order (Admin)
export const getTicketsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const tickets = await ticketModel.find({ order: orderId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('Get tickets by order error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch tickets'
    });
  }
};