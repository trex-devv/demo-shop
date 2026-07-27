// frontend/src/components/DeliveryDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const DeliveryDetailsModal = ({
  isOpen,
  onClose,
  onConfirm,
  onSave,
  product,
  isSubscription = false,
  backendUrl,
  loading: parentLoading,
  user,
  item,
  isEditing = false,
  isBuyNow = false // Add this prop
}) => {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Default fields for products
  const DEFAULT_FIELDS = [
    { key: 'username', label: 'Username', type: 'text', required: true, placeholder: 'Enter your username' },
    { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter your email address' },
    { key: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: 'Enter your phone number' },
    { key: 'id', label: 'ID', type: 'text', required: false, placeholder: 'Enter your ID (optional)' }
  ];

  // Subscription fields
  const SUBSCRIPTION_FIELDS = [
    { key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your email address' },
    { key: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: 'Enter your phone number' }
  ];

  useEffect(() => {
    if (isOpen && (product || item)) {
      fetchFields();
    }
  }, [isOpen, product, item]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      let fieldConfig = [];

      if (isSubscription) {
        fieldConfig = SUBSCRIPTION_FIELDS;
      } else if (product?.category?._id || product?.categoryId) {
        const categoryId = product.category?._id || product.categoryId;
        const response = await axios.get(
          `${backendUrl}/api/fields/fields/${categoryId}`
        );
        
        if (response.data.success) {
          const data = response.data.data;
          if (data.fields && data.fields.length > 0) {
            fieldConfig = data.fields;
          } else {
            fieldConfig = DEFAULT_FIELDS;
          }
        } else {
          fieldConfig = DEFAULT_FIELDS;
        }
      } else {
        fieldConfig = DEFAULT_FIELDS;
      }

      setFields(fieldConfig);
      
      // Initialize form data
      const initialData = {};
      
      if (isEditing && item) {
        const existingFields = item.deliveryDetails?.fields || {};
        fieldConfig.forEach(field => {
          if (existingFields[field.key] !== undefined) {
            initialData[field.key] = existingFields[field.key] || '';
          } else if (field.key === 'email' && user?.email) {
            initialData[field.key] = user.email;
          } else if (field.key === 'phone' && user?.phone) {
            initialData[field.key] = user.phone;
          } else {
            initialData[field.key] = '';
          }
        });
      } else {
        fieldConfig.forEach(field => {
          if (field.key === 'email' && user?.email) {
            initialData[field.key] = user.email;
          } else if (field.key === 'phone' && user?.phone) {
            initialData[field.key] = user.phone;
          } else {
            initialData[field.key] = '';
          }
        });
      }
      
      setFormData(initialData);
      setErrors({});
    } catch (error) {
      const defaultFields = isSubscription ? SUBSCRIPTION_FIELDS : DEFAULT_FIELDS;
      setFields(defaultFields);
      const initialData = {};
      defaultFields.forEach(field => {
        if (field.key === 'email' && user?.email) {
          initialData[field.key] = user.email;
        } else if (field.key === 'phone' && user?.phone) {
          initialData[field.key] = user.phone;
        } else {
          initialData[field.key] = '';
        }
      });
      setFormData(initialData);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    fields.forEach(field => {
      const value = formData[field.key] || '';
      
      if (field.required && !value.trim()) {
        newErrors[field.key] = `${field.label} is required`;
        isValid = false;
      }

      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field.key] = 'Please enter a valid email';
        isValid = false;
      }

      if (field.type === 'tel' && value && !/^[0-9+\-\s()]{10,15}$/.test(value)) {
        newErrors[field.key] = 'Please enter a valid phone number';
        isValid = false;
      }

      if (field.validation?.minLength && value.length < field.validation.minLength) {
        newErrors[field.key] = field.validation.message || `Minimum ${field.validation.minLength} characters required`;
        isValid = false;
      }
      if (field.validation?.maxLength && value.length > field.validation.maxLength) {
        newErrors[field.key] = field.validation.message || `Maximum ${field.validation.maxLength} characters allowed`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const fieldsData = {};
      fields.forEach(field => {
        fieldsData[field.key] = formData[field.key] || '';
      });

      const deliveryDetails = {
        fields: fieldsData,
        isSubscription: isSubscription
      };

      if (isSubscription) {
        deliveryDetails.contactEmail = formData.email || '';
        deliveryDetails.contactPhone = formData.phone || '';
      } else {
        if (formData.email) deliveryDetails.contactEmail = formData.email;
        if (formData.phone) deliveryDetails.contactPhone = formData.phone;
      }

      if (isEditing && onSave) {
        await onSave(item._id, fieldsData);
        onClose();
      } else {
        await onConfirm(deliveryDetails);
      }
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save details');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine button text
  const getButtonText = () => {
    if (submitting || parentLoading) {
      return isEditing ? 'Saving...' : 'Adding...';
    }
    if (isEditing) {
      return 'Save Changes';
    }
    if (isBuyNow) {
      return 'Buy Now';
    }
    return 'Add to Cart';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Edit Delivery Details' : (isSubscription ? 'Subscription Details' : 'Enter Details')}
            </h3>
            <p className="text-sm text-gray-500">
              {product?.name || item?.name || 'Product'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
            disabled={submitting || parentLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            <p className="text-gray-500 mt-2">Loading form...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Info Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 flex items-start gap-2">
              <p className="text-xs text-blue-700">
                {isSubscription 
                  ? 'The subscription details to the email provided.'
                  : 'Please provide correct details for proper delivery of your purchase.'
                }
              </p>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm ${
                        errors[field.key] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm ${
                        errors[field.key] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm ${
                        errors[field.key] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  )}
                  {field.helpText && (
                    <p className="text-xs text-gray-400 mt-1">{field.helpText}</p>
                  )}
                  {errors[field.key] && (
                    <p className="text-xs text-red-500 mt-1">{errors[field.key]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                disabled={submitting || parentLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || parentLoading}
                className={`w-full sm:flex-1 px-4 py-2.5 rounded-lg transition font-medium text-sm flex items-center justify-center gap-2 ${
                  isBuyNow && !isEditing
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {submitting || parentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditing ? 'Saving...' : 'Processing...'}
                  </>
                ) : (
                  getButtonText()
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DeliveryDetailsModal;