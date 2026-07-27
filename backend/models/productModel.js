import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
    required: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'subCategory'
  },
  name: { type: String, required: true },
  description: { type: String },
  images: [{ 
    public_id: String,
    secure_url: String
  }],
  pricingType: {
    type: String,
    enum: ['flat', 'variants'],
    default: 'flat'
  },
  variants: [{
    label: {
      type: String,
      required: function() {
        return this.pricingType === 'variants';
      }
    },
    price: {
      type: Number,
      required: function() {
        return this.pricingType === 'variants';
      },
      min: 0
    }
  }],
  price: { 
    type: Number,
    required: function() {
      return this.pricingType === 'flat';
    },
    min: 0
  },
  inStock: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

productSchema.pre('validate', function(next) {
  if (this.pricingType === 'flat' && !this.price) {
    next(new Error('Price is required for flat pricing'));
  } else if (this.pricingType === 'variants' && (!this.variants || this.variants.length === 0)) {
    next(new Error('At least one variant is required for variant pricing'));
  } else {
    next();
  }
});

export default mongoose.model('productModel', productSchema);