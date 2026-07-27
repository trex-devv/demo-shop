import fieldModel from "../models/fieldModel.js";
import categoryModel from "../models/categoryModel.js";
import mongoose from "mongoose";

// Get all field configurations (Admin only)
export const getAllCategories = async (req, res) => {
  try {
    const fieldConfigs = await fieldModel.find()
      .populate('categoryId', 'name slug image')
      .sort({ name: 1 })
      .lean();
    
    res.json({
      success: true,
      data: fieldConfigs
    });
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load field configurations"
    });
  }
};

// Get field config by ID (Admin only)
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const fieldConfig = await fieldModel.findById(id)
      .populate('categoryId', 'name slug image');
    
    if (!fieldConfig) {
      return res.status(404).json({
        success: false,
        message: 'Field configuration not found'
      });
    }
    
    res.json({
      success: true,
      data: fieldConfig
    });
  } catch (error) {
    console.error("Error in getCategoryById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load field configuration"
    });
  }
};

// Get category fields for frontend (Public - No auth required)
export const getCategoryFields = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Check if categoryId is a slug or ObjectId
    let fieldConfig;
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      fieldConfig = await fieldModel.findOne({ 
        categoryId: categoryId
      });
    } else {
      // Try to find by slug
      const category = await categoryModel.findOne({ slug: categoryId.toLowerCase() });
      if (category) {
        fieldConfig = await fieldModel.findOne({ 
          categoryId: category._id
        });
      }
    }
    
    let fields = [];
    
    if (fieldConfig && fieldConfig.fields && fieldConfig.fields.length > 0) {
      fields = fieldConfig.fields
        .filter(f => f.isActive !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    // Get category name
    let categoryName = categoryId;
    if (!fieldConfig) {
      const category = await categoryModel.findOne({ 
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(categoryId) ? categoryId : null },
          { slug: categoryId.toLowerCase() }
        ]
      });
      if (category) {
        categoryName = category.name;
      }
    }
    
    res.json({
      success: true,
      data: {
        categoryId: categoryId,
        name: fieldConfig?.name || categoryName || categoryId,
        hasCustomFields: fieldConfig && fieldConfig.fields && fieldConfig.fields.length > 0,
        fields: fields,
        _id: fieldConfig?._id || null
      }
    });
  } catch (error) {
    console.error("Error in getCategoryFields:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load category fields"
    });
  }
};

// Save fields for a category (Admin only)
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, categorySlug, name, fields } = req.body;
    
    // Find the actual category
    let category;
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      category = await categoryModel.findById(categoryId);
    } else {
      category = await categoryModel.findOne({ slug: categoryId.toLowerCase() });
    }
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found in database'
      });
    }
    
    // Check if field config already exists for this category
    let fieldConfig = await fieldModel.findOne({ 
      categoryId: category._id 
    });
    
    if (fieldConfig) {
      // Update existing config
      fieldConfig.fields = fields || [];
      if (name) fieldConfig.name = name;
      fieldConfig.categorySlug = category.slug;
      await fieldConfig.save();
      
      return res.json({
        success: true,
        data: fieldConfig,
        message: `Fields saved successfully`
      });
    } else {
      // Create new field config for this category
      const newFieldConfig = new fieldModel({
        categoryId: category._id,
        categorySlug: category.slug,
        name: name || category.name,
        fields: fields || []
      });
      
      await newFieldConfig.save();
      
      return res.json({
        success: true,
        data: newFieldConfig,
        message: `Fields saved successfully`
      });
    }
  } catch (error) {
    console.error("Error in updateCategory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save fields"
    });
  }
};

// Delete field configuration (Admin only)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const fieldConfig = await fieldModel.findByIdAndDelete(id);
    if (!fieldConfig) {
      return res.status(404).json({
        success: false,
        message: 'Field configuration not found'
      });
    }
    
    res.json({
      success: true,
      message: `Field configuration deleted successfully`
    });
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete field configuration"
    });
  }
};

// Add field to category (Admin only)
export const addFieldToCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const fieldData = req.body;
    
    const fieldConfig = await fieldModel.findById(id);
    if (!fieldConfig) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if field key already exists
    const fieldExists = fieldConfig.fields.some(f => f.key === fieldData.key);
    if (fieldExists) {
      return res.status(400).json({
        success: false,
        message: `Field "${fieldData.key}" already exists in this category`
      });
    }
    
    fieldConfig.fields.push(fieldData);
    await fieldConfig.save();
    
    res.json({
      success: true,
      data: fieldConfig,
      message: `Field added successfully`
    });
  } catch (error) {
    console.error("Error in addFieldToCategory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add field"
    });
  }
};

// Update field in category (Admin only)
export const updateFieldInCategory = async (req, res) => {
  try {
    const { id, fieldId } = req.params;
    const updateData = req.body;
    
    const fieldConfig = await fieldModel.findById(id);
    if (!fieldConfig) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const fieldIndex = fieldConfig.fields.findIndex(f => f._id.toString() === fieldId);
    if (fieldIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }
    
    // Update the field
    fieldConfig.fields[fieldIndex] = {
      ...fieldConfig.fields[fieldIndex].toObject(),
      ...updateData
    };
    
    await fieldConfig.save();
    
    res.json({
      success: true,
      data: fieldConfig,
      message: `Field updated successfully`
    });
  } catch (error) {
    console.error("Error in updateFieldInCategory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update field"
    });
  }
};

// Delete field from category (Admin only)
export const deleteFieldFromCategory = async (req, res) => {
  try {
    const { id, fieldId } = req.params;
    
    const fieldConfig = await fieldModel.findById(id);
    if (!fieldConfig) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const fieldToDelete = fieldConfig.fields.find(f => f._id.toString() === fieldId);
    if (!fieldToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }
    
    fieldConfig.fields = fieldConfig.fields.filter(f => f._id.toString() !== fieldId);
    await fieldConfig.save();
    
    res.json({
      success: true,
      data: fieldConfig,
      message: `Field deleted successfully`
    });
  } catch (error) {
    console.error("Error in deleteFieldFromCategory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete field"
    });
  }
};

// Reorder fields (Admin only)
export const reorderFields = async (req, res) => {
  try {
    const { id } = req.params;
    const { fieldOrders } = req.body;
    
    if (!fieldOrders || !Array.isArray(fieldOrders)) {
      return res.status(400).json({
        success: false,
        message: "Field orders are required"
      });
    }
    
    const fieldConfig = await fieldModel.findById(id);
    if (!fieldConfig) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    fieldOrders.forEach(({ fieldId, order }) => {
      const field = fieldConfig.fields.id(fieldId);
      if (field) {
        field.order = order;
      }
    });
    
    fieldConfig.fields.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    await fieldConfig.save();
    
    res.json({
      success: true,
      data: fieldConfig,
      message: "Fields reordered successfully"
    });
  } catch (error) {
    console.error("Error in reorderFields:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder fields"
    });
  }
};