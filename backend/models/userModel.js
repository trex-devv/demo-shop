import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    phone: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: null
    },
    cartData: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Only define indexes for fields that don't already have `unique: true` or `index: true`
// Remove the email index since it's already covered by `unique: true`
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

const userModel = mongoose.models.user || mongoose.model('user', userSchema);
export default userModel;