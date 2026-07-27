import mongoose from "mongoose";

const deliveryDetailsSchema = new mongoose.Schema({
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  fields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isSubscription: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'productModel'
  },
  subscriptionId: {
    type: String,
    default: null
  },
  name: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: null
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
  },
  categorySlug: {
    type: String,
    default: ''
  },
  isSubscription: {
    type: Boolean,
    default: false
  },
  variantLabel: {
    type: String,
    default: null
  },
  duration: {
    type: String,
    default: null
  },
  deliveryDetails: {
    type: deliveryDetailsSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}${month}${day}-${random}`;
};

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [orderItemSchema],
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash on Delivery', 'eSewa', 'Khalti', 'Mobile Banking', 'FonePay']
  },
  paymentProof: {
    screenshotUrl: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  paymentMethodDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: [
      'Pending Verification',
      'Payment Verified',
      'Payment Rejected',
      'Delivered',
      'Invalid Details',
      'Cancelled'
    ],
    default: 'Pending Verification'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  cancellationRequested: {
    type: Boolean,
    default: false
  },
  cancellationReason: {
    type: String,
    enum: ['Wrong Player ID', 'Accidental Order', 'Other'],
    default: null
  },
  cancellationNote: {
    type: String,
    trim: true,
    default: ''
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  refundStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Refunded', 'Not Applicable'],
    default: 'Not Applicable'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

orderSchema.pre('validate', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = generateOrderNumber();
  }
  next();
});

orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = generateOrderNumber();
  }
  next();
});

orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ userId: 1, cancellationRequested: 1 });

export default mongoose.model('orderModel', orderSchema);