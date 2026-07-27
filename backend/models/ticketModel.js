import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'orderModel',
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'Item Not Delivered',
      'Wrong Item Received',
      'Missing Items',
      'Delayed Delivery',
      'Wrong Details Submitted',
      'Items Not Received In-Game',
      'Payment Not Verified',
      'Other'
    ],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  attachments: [{
    url: String,
    public_id: String,
    filename: String
  }],
  status: {
    type: String,
    enum: ['Open', 'Hold', 'Resolved', 'Rejected'],
    default: 'Open'
  },
  adminNote: {
    type: String,
    trim: true,
    default: ''
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ order: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ createdAt: -1 });

ticketSchema.statics.getTicketCountForOrder = async function(orderId) {
  return await this.countDocuments({ order: orderId });
};

export default mongoose.model('ticketModel', ticketSchema);