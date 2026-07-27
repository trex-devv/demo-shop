// admin/src/pages/Add.jsx
import React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import siteConfig from "../config/site.config";
import { Image, Plus, X, Loader2, Trash2 } from "lucide-react";

const Add = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [pricingType, setPricingType] = useState("flat");
  const [price, setPrice] = useState("");
  const [variants, setVariants] = useState([{ label: "", price: "" }]);
  const [inStock, setInStock] = useState(true);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Check if in edit mode
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchProductForEdit(id);
    }
  }, [id]);

  // Fetch categories on load
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (category) {
      fetchSubcategories(category);
    } else {
      setSubcategories([]);
      setSubCategory("");
    }
  }, [category]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/category");
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const response = await axios.get(backendUrl + `/api/subcategory/category/${categoryId}`);
      if (response.data.success) {
        setSubcategories(response.data.subcategories || []);
      }
    } catch (error) {
    }
  };

  const fetchProductForEdit = async (productId) => {
    try {
      setFormLoading(true);
      const response = await axios.get(backendUrl + "/api/product/" + productId);
      if (response.data.success) {
        const product = response.data.product;
        setName(product.name || "");
        setDescription(product.description || "");
        setCategory(product.category?._id || "");
        setSubCategory(product.subCategory?._id || "");
        setPricingType(product.pricingType || "flat");
        setInStock(product.inStock !== undefined ? product.inStock : true);
        
        if (product.pricingType === "flat") {
          setPrice(product.price?.toString() || "");
          setVariants([{ label: "", price: "" }]);
        } else {
          setPrice("");
          setVariants(product.variants?.length ? product.variants : [{ label: "", price: "" }]);
        }
        
        // Set images - store as URLs for existing images
        if (product.images && product.images.length > 0) {
          const imageUrls = product.images.map(img => img.secure_url);
          setImagePreviews(imageUrls);
          // Store as strings (URLs)
          setImages(imageUrls);
        }
      } else {
        toast.error("Product not found");
        navigate("/list");
      }
    } catch (error) {
      toast.error("Failed to load product data");
      navigate("/list");
    } finally {
      setFormLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check file sizes
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error("Some images exceed 5MB limit");
      return;
    }

    // Check total images limit (max 4)
    const currentImageCount = imagePreviews.length;
    if (currentImageCount + files.length > 4) {
      toast.error("Maximum 4 images allowed");
      return;
    }

    // Generate previews for new files
    const readers = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((results) => {
      setImagePreviews([...imagePreviews, ...results]);
      // Store the actual File objects for upload
      setImages([...images, ...files]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newImages = images.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
    setImages(newImages);
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { label: "", price: "" }]);
  };

  const removeVariant = (index) => {
    if (variants.length <= 1) {
      toast.error("At least one variant is required");
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setSubCategory("");
    setPrice("");
    setVariants([{ label: "", price: "" }]);
    setImages([]);
    setImagePreviews([]);
    setInStock(true);
    setPricingType("flat");
    setFormLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    if (pricingType === "flat") {
      if (!price || parseFloat(price) <= 0) {
        toast.error("Please enter a valid price");
        return;
      }
    } else {
      const validVariants = variants.filter(v => v.label.trim() && v.price);
      if (validVariants.length === 0) {
        toast.error("Please add at least one valid variant");
        return;
      }
      setVariants(validVariants);
    }

    setFormLoading(true);

    try {
      // Prepare data
      const productData = {
        name: name.trim(),
        description: description.trim(),
        category,
        subCategory: subCategory || undefined,
        pricingType,
        inStock,
        images: []
      };

      // Handle pricing
      if (pricingType === "flat") {
        productData.price = parseFloat(price);
      } else {
        productData.variants = variants.filter(v => v.label.trim() && v.price).map(v => ({
          label: v.label.trim(),
          price: parseFloat(v.price)
        }));
      }

      // Handle images - important for edit mode
      if (images.length > 0) {
        // Process each image to determine if it's a File object or URL
        const processedImages = await Promise.all(images.map(async (img) => {
          // If it's a File object (new image)
          if (typeof img === 'object' && img instanceof File) {
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(img);
            });
          }
          // If it's already a string (existing image URL)
          return img;
        }));
        productData.images = processedImages;
      }

      let response;
      if (isEditMode) {
        response = await axios.put(
          backendUrl + "/api/product/" + id,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          backendUrl + "/api/product",
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        toast.success(isEditMode ? "Product updated successfully!" : "Product added successfully!");
        if (isEditMode) {
          navigate("/list");
        } else {
          resetForm();
        }
      } else {
        toast.error(response.data.message || "Failed to save product");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save product. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  if (formLoading && isEditMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl sm:text-lg font-semibold text-gray-900">
            {isEditMode ? "Edit Product" : "Add Product"}
          </h3>
          <p className="text-sm sm:text-sm text-gray-500 mt-0.5">
            {isEditMode ? "Update product details" : "Add a new product to your store"}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmitHandler} className="space-y-6 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
        {/* Images */}
        <div>
          <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-2.5">
            Product Images
          </label>
          <div className="flex flex-wrap gap-3">
            {/* Image Upload Button */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="product-images"
                disabled={formLoading || imagePreviews.length >= 4}
              />
              <label
                htmlFor="product-images"
                className={`flex flex-col items-center justify-center w-24 h-24 sm:w-24 sm:h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition cursor-pointer ${
                  imagePreviews.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Plus size={26} className="text-gray-400" />
                <span className="text-xs sm:text-xs text-gray-500 mt-1.5 text-center">Add Image</span>
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative w-24 h-24 sm:w-24 sm:h-24 rounded-xl border border-gray-200 overflow-hidden group">
                <img
                  src={preview}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-red-700"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs sm:text-xs text-gray-400 mt-2">Max 4 images, 5MB each</p>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5">
            Product Name *
          </label>
          <input
            type="text"
            placeholder="e.g., PUBG UC 100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm"
            required
            disabled={formLoading}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            placeholder="Product description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full max-w-2xl px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm resize-y"
            rows="4"
            disabled={formLoading}
          />
        </div>

        {/* Category & Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm appearance-none bg-white"
              required
              disabled={formLoading}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5">
              Subcategory
            </label>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm appearance-none bg-white"
              disabled={formLoading || !category}
            >
              <option value="">Select Subcategory (Optional)</option>
              {subcategories.map((sub) => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing Type */}
        <div>
          <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-2.5">
            Pricing Type
          </label>
          <div className="flex flex-wrap gap-5">
            {siteConfig.pricingTypes.map((type) => (
              <label key={type.value} className="flex items-center gap-2.5">
                <input
                  type="radio"
                  value={type.value}
                  checked={pricingType === type.value}
                  onChange={(e) => setPricingType(e.target.value)}
                  className="accent-gray-900 w-4 h-4"
                  disabled={formLoading}
                />
                <span className="text-sm sm:text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Flat Price */}
        {pricingType === "flat" && (
          <div className="max-w-xs">
            <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {siteConfig.currency.symbol}
              </span>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm"
                required={pricingType === "flat"}
                disabled={formLoading}
              />
            </div>
          </div>
        )}

        {/* Variants */}
        {pricingType === "variants" && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-sm sm:text-sm font-medium text-gray-700">
                Variants *
              </label>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1.5 text-sm sm:text-sm text-gray-600 hover:text-gray-900 transition"
                disabled={formLoading}
              >
                <Plus size={18} />
                Add Variant
              </button>
            </div>
            <div className="space-y-2.5">
              {variants.map((variant, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Label (e.g., 100 UC)"
                      value={variant.label}
                      onChange={(e) => handleVariantChange(index, "label", e.target.value)}
                      className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm"
                      disabled={formLoading}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        {siteConfig.currency.symbol}
                      </span>
                      <input
                        type="number"
                        placeholder="Price"
                        step="0.01"
                        min="0"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, "price", e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm"
                        disabled={formLoading}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="p-2.5 sm:p-2 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                    disabled={formLoading || variants.length <= 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* In Stock */}
        <div>
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={inStock}
              onChange={() => setInStock(!inStock)}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
              disabled={formLoading}
            />
            <span className="text-sm sm:text-sm font-medium text-gray-700">In Stock</span>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-gray-200">
          <button
            type="submit"
            disabled={formLoading}
            className="px-7 py-2.5 sm:px-6 sm:py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-sm min-w-[130px]"
          >
            {formLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              isEditMode ? 'Update Product' : 'Add Product'
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isEditMode) {
                navigate("/list");
              } else {
                resetForm();
              }
            }}
            className="px-6 py-2.5 sm:px-6 sm:py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm sm:text-sm"
            disabled={formLoading}
          >
            {isEditMode ? 'Cancel' : 'Reset'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Add;