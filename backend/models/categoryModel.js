import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Category name is required'],
    trim: true 
  },
  image: { 
    type: String,
    default: '' // Allow empty image
  },
  slug: { 
    type: String, 
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('category', categorySchema);