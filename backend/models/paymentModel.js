import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Payment method name is required'],
    enum: ['Cash on Delivery', 'eSewa', 'Khalti', 'Mobile Banking', 'FonePay']
  },
  qrCode: {
    type: String, // Cloudinary URL - only for online payments
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCOD: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('paymentModel', paymentMethodSchema);