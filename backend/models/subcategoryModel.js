import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
    required: [true, 'Category is required']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  image: {
    type: String,
    default: '' // Cloudinary URL for subcategory image
  }
}, {
  timestamps: true
});

// Generate slug from name
subcategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Check if products exist before removing
subcategorySchema.pre('findOneAndDelete', async function(next) {
  const subcategoryId = this.getFilter()._id;
  const Product = mongoose.model('productModel');
  const count = await Product.countDocuments({ subCategory: subcategoryId });
  if (count > 0) {
    next(new Error(`Cannot delete subcategory. ${count} product(s) still reference it.`));
  } else {
    next();
  }
});

export default mongoose.model('subCategory', subcategorySchema);