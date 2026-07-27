import mongoose from 'mongoose';

const fieldOptionSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  }
});

const fieldSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'email', 'tel', 'select', 'textarea', 'password'],
    default: 'text'
  },
  optional: {
    type: Boolean,
    default: false // false = required, true = optional
  },
  placeholder: {
    type: String,
    required: true,
    default: ''
  },
  helpText: {
    type: String,
    default: ''
  },
  options: [fieldOptionSchema],
  validation: {
    minLength: {
      type: Number,
      default: null
    },
    maxLength: {
      type: Number,
      default: null
    },
    message: {
      type: String,
      default: ''
    }
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const fieldModelSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',  // Reference to the category model
    required: true,
    unique: true
  },
  categorySlug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  fields: [fieldSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
fieldModelSchema.index({ categoryId: 1, isActive: 1 });
fieldModelSchema.index({ categorySlug: 1 });
fieldModelSchema.index({ name: 1 });

export default mongoose.model('FieldModel', fieldModelSchema);