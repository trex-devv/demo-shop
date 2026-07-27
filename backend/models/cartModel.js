import mongoose from "mongoose";

const deliveryDetailsSchema = new mongoose.Schema({
  contactEmail: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    required: false,
    trim: true
  },
  fields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  fieldConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isSubscription: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const cartItemSchema = new mongoose.Schema({
  // For products
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'productModel',
    required: false // Made optional for subscriptions
  },
  // For subscriptions
  subscriptionId: {
    type: String, // Store as string since subscription IDs are from different collection
    required: false,
    index: true
  },
  variant: {
    type: String,
    default: null
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  name: {
    type: String,
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
    required: false
  },
  categorySlug: {
    type: String,
    default: ''
  },
  // Subscription specific fields
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
  // Delivery details
  deliveryDetails: {
    type: deliveryDetailsSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Ensure either productId or subscriptionId exists
cartItemSchema.pre('validate', function(next) {
  if (!this.productId && !this.subscriptionId) {
    next(new Error('Either productId or subscriptionId is required'));
  }
  next();
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

// Virtual for total
cartSchema.virtual('total').get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Enable virtuals in JSON
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

export default mongoose.model('cartModel', cartSchema);