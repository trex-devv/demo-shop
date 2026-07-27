import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subscription name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Streaming', 'Music', 'Gaming', 'Shopping', 'Productivity', 'Other'],
    default: 'Other'
  },
  // Variants like: 1 Month, 3 Months, 6 Months, 1 Year
  variants: [{
    label: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    duration: {
      type: String,
      enum: ['monthly', '3-months', '6-months', 'yearly'],
      required: true
    },
    durationLabel: {
      type: String,
      default: ''
    }
  }],
  images: [{
    public_id: String,
    secure_url: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  provider: {
    type: String,
    trim: true
  },
  providerWebsite: {
    type: String,
    trim: true
  },
  features: [{
    type: String
  }]
}, {
  timestamps: true
});

// Generate slug from name
subscriptionSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Indexes
subscriptionSchema.index({ name: 1 });
subscriptionSchema.index({ category: 1 });
subscriptionSchema.index({ isActive: 1 });
subscriptionSchema.index({ isPopular: 1 });

export default mongoose.model('subscriptionModel', subscriptionSchema);