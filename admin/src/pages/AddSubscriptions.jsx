// admin/src/pages/AddSubscription.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { Plus, X, Loader2, Trash2 } from "lucide-react";

const AddSubscription = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Other",
    features: [],
    isActive: true,
    isPopular: false,
    provider: "",
    providerWebsite: ""
  });
  const [variants, setVariants] = useState([{ label: "", price: "", duration: "monthly" }]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [featureInput, setFeatureInput] = useState("");

  const durationOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: '3-months', label: '3 Months' },
    { value: '6-months', label: '6 Months' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const categoryOptions = [
    'Streaming', 'Music', 'Gaming', 'Shopping', 'Productivity', 'Other'
  ];

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchSubscription(id);
    }
  }, [id]);

  const fetchSubscription = async (subscriptionId) => {
    try {
      setFormLoading(true);
      const response = await axios.get(
        `${backendUrl}/api/subscription/${subscriptionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const sub = response.data.subscription;
        setFormData({
          name: sub.name || "",
          description: sub.description || "",
          category: sub.category || "Other",
          features: sub.features || [],
          isActive: sub.isActive !== undefined ? sub.isActive : true,
          isPopular: sub.isPopular || false,
          provider: sub.provider || "",
          providerWebsite: sub.providerWebsite || ""
        });
        setVariants(sub.variants || [{ label: "", price: "", duration: "monthly" }]);
        if (sub.images && sub.images.length > 0) {
          setImagePreviews(sub.images.map(img => img.secure_url));
          setImages(sub.images.map(img => img.secure_url));
        }
      }
    } catch (error) {
      toast.error('Failed to load subscription data');
      navigate('/subscriptions');
    } finally {
      setFormLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.some(f => f.size > 5 * 1024 * 1024)) {
      toast.error("Images must be less than 5MB");
      return;
    }

    if (images.length + files.length > 4) {
      toast.error("Maximum 4 images allowed");
      return;
    }

    const readers = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((results) => {
      setImagePreviews([...imagePreviews, ...results]);
      setImages([...images, ...files]);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    setImages(images.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { label: "", price: "", duration: "monthly" }]);
  };

  const removeVariant = (index) => {
    if (variants.length <= 1) {
      toast.error("At least one variant is required");
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Subscription name is required");
      return;
    }

    // Validate variants
    const validVariants = variants.filter(v => v.label.trim() && v.price && v.price > 0);
    if (validVariants.length === 0) {
      toast.error("Please add at least one valid variant");
      return;
    }

    setFormLoading(true);

    try {
      const submitData = {
        ...formData,
        variants: validVariants.map(v => ({
          label: v.label.trim(),
          price: parseFloat(v.price),
          duration: v.duration
        })),
        images: imagePreviews
      };

      let response;
      if (isEditMode) {
        response = await axios.put(
          `${backendUrl}/api/subscription/${id}`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${backendUrl}/api/subscription`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        toast.success(response.data.message);
        navigate('/subscriptions');
      } else {
        toast.error(response.data.message || "Failed to save subscription");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save subscription");
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl sm:text-lg font-semibold text-gray-900">
              {isEditMode ? "Edit Subscription" : "Add New Subscription"}
            </h3>
            <p className="text-sm sm:text-sm text-gray-500 mt-0.5">
              {isEditMode ? "Update subscription details" : "Add a new subscription plan"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          {/* Images */}
          <div>
            <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-2.5">
              Logo / Images
            </label>
            <div className="flex flex-wrap gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="sub-images"
                disabled={formLoading || images.length >= 4}
              />
              <label
                htmlFor="sub-images"
                className={`flex flex-col items-center justify-center w-24 h-24 sm:w-24 sm:h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition cursor-pointer ${
                  images.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Plus size={26} className="text-gray-400" />
                <span className="text-xs sm:text-xs text-gray-500 mt-1.5 text-center">Add Image</span>
              </label>
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative w-24 h-24 sm:w-24 sm:h-24 rounded-xl border border-gray-200 overflow-hidden group">
                  <img src={preview} alt={`Subscription ${index + 1}`} className="w-full h-full object-cover" />
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

          {/* Name & Provider */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5">
                Subscription Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Netflix Premium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm"
                required
                disabled={formLoading}
              />
            </div>
            <div>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5">
                Provider
              </label>
              <input
                type="text"
                placeholder="e.g., Netflix Inc."
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm"
                disabled={formLoading}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Subscription description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm resize-y"
              disabled={formLoading}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm appearance-none bg-white"
              disabled={formLoading}
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Provider Website */}
          <div>
            <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5">
              Provider Website
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.providerWebsite}
              onChange={(e) => setFormData({ ...formData, providerWebsite: e.target.value })}
              className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm"
              disabled={formLoading}
            />
          </div>

          {/* Variants */}
          <div>
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
                <div key={index} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <div className="w-full sm:flex-1">
                    <input
                      type="text"
                      placeholder="Label (e.g., 1 Month)"
                      value={variant.label}
                      onChange={(e) => handleVariantChange(index, "label", e.target.value)}
                      className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm"
                      disabled={formLoading}
                    />
                  </div>
                  <div className="w-full sm:flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        Rs.
                      </span>
                      <input
                        type="number"
                        placeholder="Price"
                        step="0.01"
                        min="0"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, "price", e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm"
                        disabled={formLoading}
                      />
                    </div>
                  </div>
                  <div className="w-full sm:flex-1">
                    <select
                      value={variant.duration}
                      onChange={(e) => handleVariantChange(index, "duration", e.target.value)}
                      className="w-full px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm appearance-none bg-white"
                      disabled={formLoading}
                    >
                      {durationOptions.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
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

          {/* Features */}
          <div>
            <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5">
              Features
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a feature..."
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm"
                disabled={formLoading}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-5 py-2.5 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition text-sm sm:text-sm"
              >
                Add
              </button>
            </div>
            {formData.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.features.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-3 sm:py-1 bg-gray-100 rounded-xl text-sm sm:text-sm"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="text-gray-400 hover:text-red-600 transition"
                    >
                      <X size={15} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                disabled={formLoading}
              />
              <span className="text-sm sm:text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                disabled={formLoading}
              />
              <span className="text-sm sm:text-sm text-gray-700">Popular</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-gray-200">
            <button
              type="submit"
              disabled={formLoading}
              className="px-7 py-2.5 sm:px-6 sm:py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-sm min-w-[130px]"
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Subscription' : 'Create Subscription'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/subscriptions')}
              className="px-6 py-2.5 sm:px-6 sm:py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubscription;