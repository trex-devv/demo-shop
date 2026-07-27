import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { 
  Plus, Edit, Trash2, Loader2, X, Search, 
  Save, AlertCircle, Settings, ArrowUp, ArrowDown,
  Image, ChevronLeft
} from "lucide-react";
import DeleteModal from "../components/UI/DeleteModal";

const FieldManagement = ({ token }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    label: "",
    type: "text",
    required: true,
    placeholder: "",
    helpText: "",
    options: [],
    validation: {
      minLength: null,
      maxLength: null,
      message: ""
    },
    isActive: true
  });
  const [fieldOptions, setFieldOptions] = useState([]);
  const [newOption, setNewOption] = useState("");
  
  const [deleteModal, setDeleteModal] = useState({ 
    isOpen: false, 
    id: null, 
    name: '',
    categoryId: null 
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const catResponse = await axios.get(backendUrl + "/api/category");
      if (catResponse.data.success) {
        const categoriesData = catResponse.data.categories || [];
        
        const categoriesWithFields = await Promise.all(
          categoriesData.map(async (cat) => {
            try {
              const fieldResponse = await axios.get(
                backendUrl + `/api/fields/fields/${cat.slug || cat._id}`
              );
              if (fieldResponse.data.success) {
                const data = fieldResponse.data.data;
                return {
                  ...cat,
                  hasCustomFields: data.hasCustomFields || false,
                  fields: data.fields || [],
                  fieldConfig: data
                };
              }
            } catch (error) {
              return {
                ...cat,
                hasCustomFields: false,
                fields: []
              };
            }
            return {
              ...cat,
              hasCustomFields: false,
              fields: []
            };
          })
        );
        
        setCategories(categoriesWithFields);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const saveCategoryFields = async () => {
    if (!selectedCategory) {
      toast.error("No category selected");
      return;
    }

    setSaving(true);
    try {
      const authHeaders = {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      };
      
      const categoryId = selectedCategory._id;
      
      let existingConfig = null;
      let existingId = null;
      
      try {
        const response = await axios.get(
          backendUrl + `/api/fields/fields/${categoryId}`
        );
        if (response.data.success && response.data.data._id) {
          existingId = response.data.data._id;
          existingConfig = response.data.data;
        }
      } catch (error) {
        // No existing config - that's fine, we'll create one
      }

      let response;
      if (existingId) {
        response = await axios.put(
          backendUrl + `/api/fields/${existingId}`,
          {
            categoryId: categoryId,
            categorySlug: selectedCategory.slug,
            name: selectedCategory.name,
            fields: fields
          },
          authHeaders
        );
      } else {
        response = await axios.put(
          backendUrl + `/api/fields/${categoryId}`,
          {
            categoryId: categoryId,
            categorySlug: selectedCategory.slug,
            name: selectedCategory.name,
            fields: fields
          },
          authHeaders
        );
      }
      
      if (response.data.success) {
        toast.success("Fields saved successfully!");
        const updatedCategory = {
          ...selectedCategory,
          fields: fields,
          hasCustomFields: fields && fields.length > 0
        };
        setSelectedCategory(updatedCategory);
        
        const updatedCategories = categories.map(cat => 
          cat._id === selectedCategory._id ? updatedCategory : cat
        );
        setCategories(updatedCategories);
        setShowConfigModal(false);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 404) {
        toast.error("Category not found. Please refresh and try again.");
      } else {
        toast.error(error.response?.data?.message || "Failed to save fields");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFieldSubmit = async (e) => {
    e.preventDefault();
    
    if (!fieldForm.label || !fieldForm.label.trim()) {
      toast.error("Field name is required");
      return;
    }
    if (!fieldForm.placeholder || !fieldForm.placeholder.trim()) {
      toast.error("Placeholder is required");
      return;
    }
    if (fieldForm.type === "select" && fieldOptions.length === 0) {
      toast.error("Please add at least one option for select field");
      return;
    }

    setFormLoading(true);

    const autoKey = fieldForm.label.toLowerCase().replace(/\s+/g, '_');

    const newField = {
      ...fieldForm,
      key: autoKey,
      options: fieldOptions,
      order: fields.length
    };

    if (editingField) {
      const updatedFields = fields.map(f => 
        f._id === editingField._id ? { ...newField, _id: f._id } : f
      );
      setFields(updatedFields);
      toast.success("Field updated!");
    } else {
      const { _id, ...fieldWithoutId } = newField;
      setFields([...fields, fieldWithoutId]);
      toast.success("Field added! Please save changes.");
    }

    setFormLoading(false);
    resetForm();
  };

  const handleDeleteField = (fieldId) => {
    const fieldToDelete = fields.find(f => f._id === fieldId);
    if (fieldToDelete) {
      setDeleteModal({
        isOpen: true,
        id: fieldId,
        name: fieldToDelete.label,
        categoryId: selectedCategory?._id
      });
    }
  };

  const confirmDeleteField = () => {
    const { id } = deleteModal;
    const updatedFields = fields.filter(f => f._id !== id);
    setFields(updatedFields);
    setDeleteModal({ isOpen: false, id: null, name: '', categoryId: null });
    toast.success("Field deleted");
  };

  const resetForm = () => {
    setFieldForm({
      label: "",
      type: "text",
      required: true,
      placeholder: "",
      helpText: "",
      options: [],
      validation: {
        minLength: null,
        maxLength: null,
        message: ""
      },
      isActive: true
    });
    setFieldOptions([]);
    setNewOption("");
    setIsAdding(false);
    setEditingField(null);
    setFormLoading(false);
  };

  const startEdit = (field) => {
    setEditingField(field);
    setFieldForm({
      label: field.label,
      type: field.type,
      required: field.required !== undefined ? field.required : true,
      placeholder: field.placeholder || "",
      helpText: field.helpText || "",
      options: field.options || [],
      validation: field.validation || {
        minLength: null,
        maxLength: null,
        message: ""
      },
      isActive: field.isActive !== undefined ? field.isActive : true
    });
    setFieldOptions(field.options || []);
    setIsAdding(true);
  };

  const addOption = () => {
    if (newOption.trim()) {
      setFieldOptions([...fieldOptions, { value: newOption.trim(), label: newOption.trim() }]);
      setNewOption("");
    }
  };

  const removeOption = (index) => {
    setFieldOptions(fieldOptions.filter((_, i) => i !== index));
  };

  const moveField = (index, direction) => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  const getFieldTypeLabel = (type) => {
    const types = {
      text: 'Text',
      number: 'Number',
      email: 'Email',
      tel: 'Phone',
      select: 'Dropdown',
      textarea: 'Text Area',
      password: 'Password'
    };
    return types[type] || type;
  };

  const openConfigModal = (category) => {
    setSelectedCategory(category);
    setFields(category.hasCustomFields ? (category.fields || []) : []);
    setShowConfigModal(true);
    resetForm();
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(term) ||
      cat.slug.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Field Management</h3>
          <p className="text-sm text-gray-500">Configure what information to collect from customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
      <div className="relative max-w-md flex items-center"> 
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" 
          size={16} 
        />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm bg-white/80 backdrop-blur-sm transition-all"
        />
      </div>
    </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategories.length === 0 ? (
          <p className="col-span-full text-center py-8 text-gray-500">No categories found</p>
        ) : (
          filteredCategories.map((cat) => (
            <div 
              key={cat._id} 
              className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition"
            >
              <div className="flex items-start gap-3">
                {cat.image ? (
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-14 h-14 object-cover rounded border flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded border flex items-center justify-center flex-shrink-0">
                    <Image className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{cat.name}</h4>
                  <p className="text-sm text-gray-500 truncate">/{cat.slug}</p>
                  {cat.hasCustomFields ? (
                    <span className="inline-block text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                      {cat.fields?.length || 0} fields
                    </span>
                  ) : (
                    <span className="inline-block text-xs font-medium bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">
                      Default fields
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openConfigModal(cat)}
                  className="flex items-center gap-1 text-sm px-4 py-1.5 bg-gray-900 text-gray-200 hover:bg-gray-700 rounded-md transition ml-auto"
                >
                  Configure Fields
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Configure Modal */}
      {showConfigModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                {selectedCategory.image ? (
                  <img 
                    src={selectedCategory.image} 
                    alt={selectedCategory.name} 
                    className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Image className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedCategory.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedCategory.hasCustomFields ? (
                      `${fields.length} custom field${fields.length !== 1 ? 's' : ''}`
                    ) : (
                      'Using default fields'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Tip */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  Add fields to collect information from users when they purchase product from <b>{selectedCategory.name}</b> category.
                </p>
              </div>

              {/* Add Field Button */}
              <button
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium mb-6"
              >
                <Plus size={16} />
                Create New Field
              </button>

              {/* Add/Edit Form */}
              {isAdding && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {editingField ? 'Edit Field' : 'Add New Field'}
                  </h3>
                  <form onSubmit={handleFieldSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Field Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Character UID"
                          value={fieldForm.label}
                          onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                          required
                          disabled={formLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Field Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={fieldForm.type}
                          onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                          disabled={formLoading}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                          <option value="select">Dropdown</option>
                          <option value="textarea">Text Area</option>
                          <option value="password">Password</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Placeholder <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Enter your UID"
                          value={fieldForm.placeholder}
                          onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                          required
                          disabled={formLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Help Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Found in your profile"
                          value={fieldForm.helpText}
                          onChange={(e) => setFieldForm({ ...fieldForm, helpText: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                          disabled={formLoading}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!fieldForm.required}
                          onChange={(e) => setFieldForm({ ...fieldForm, required: !e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          disabled={formLoading}
                        />
                        Optional field
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldForm.isActive}
                          onChange={(e) => setFieldForm({ ...fieldForm, isActive: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          disabled={formLoading}
                        />
                        Active
                      </label>
                    </div>

                    {fieldForm.type === 'select' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Options <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            placeholder="Add an option"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                            onKeyPress={(e) => e.key === 'Enter' && addOption()}
                            disabled={formLoading}
                          />
                          <button
                            type="button"
                            onClick={addOption}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium whitespace-nowrap"
                            disabled={formLoading}
                          >
                            Add
                          </button>
                        </div>
                        {fieldOptions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {fieldOptions.map((option, index) => (
                              <span
                                key={index}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                              >
                                {option.label}
                                <button
                                  type="button"
                                  onClick={() => removeOption(index)}
                                  className="text-red-500 hover:text-red-700"
                                  disabled={formLoading}
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Validation (Optional)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Min Length</label>
                          <input
                            type="number"
                            value={fieldForm.validation.minLength || ''}
                            onChange={(e) => setFieldForm({
                              ...fieldForm,
                              validation: { ...fieldForm.validation, minLength: e.target.value ? parseInt(e.target.value) : null }
                            })}
                            placeholder="e.g., 5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                            min="0"
                            disabled={formLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Max Length</label>
                          <input
                            type="number"
                            value={fieldForm.validation.maxLength || ''}
                            onChange={(e) => setFieldForm({
                              ...fieldForm,
                              validation: { ...fieldForm.validation, maxLength: e.target.value ? parseInt(e.target.value) : null }
                            })}
                            placeholder="e.g., 20"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                            min="0"
                            disabled={formLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Error Message</label>
                          <input
                            type="text"
                            value={fieldForm.validation.message || ''}
                            onChange={(e) => setFieldForm({
                              ...fieldForm,
                              validation: { ...fieldForm.validation, message: e.target.value }
                            })}
                            placeholder="Please enter a valid value"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                            disabled={formLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {formLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {editingField ? 'Updating...' : 'Adding...'}
                          </>
                        ) : (
                          editingField ? 'Update Field' : 'Add Field'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                        disabled={formLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Fields Grid */}
              {fields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {fields.map((field, index) => (
                    <div 
                      key={field._id || index} 
                      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {field.label}
                            </h4>
                            {field.required !== false ? (
                              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                Required
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                Optional
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              field.isActive !== false 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {field.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {getFieldTypeLabel(field.type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1.5 truncate">
                            "{field.placeholder}"
                          </p>
                          {(field.validation?.minLength || field.validation?.maxLength) && (
                            <p className="text-sm text-gray-400 mt-0.5">
                              {field.validation.minLength && `Min: ${field.validation.minLength}`}
                              {field.validation.minLength && field.validation.maxLength && ' • '}
                              {field.validation.maxLength && `Max: ${field.validation.maxLength}`}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => moveField(index, 'up')}
                            disabled={index === 0}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveField(index, 'down')}
                            disabled={index === fields.length - 1}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                        <div className="flex-1"></div>
                        <button
                          onClick={() => startEdit(field)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                          title="Edit Field"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete Field"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <div className="text-sm text-gray-500 order-2 sm:order-1">
                {fields.length} field{fields.length !== 1 ? 's' : ''} configured
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    resetForm();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Close
                </button>
                <button
                  onClick={saveCategoryFields}
                  disabled={saving}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '', categoryId: null })}
        onConfirm={confirmDeleteField}
        title="Field"
        itemName={deleteModal.name}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default FieldManagement;