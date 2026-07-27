import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, Image, Loader2, Search, X } from "lucide-react";
import DeleteModal from "../components/UI/DeleteModal";

const Categories = ({ token }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [formData, setFormData] = useState({ name: "", slug: "", image: "" });
  const [imagePreview, setImagePreview] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + "/api/category");
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    
    const term = searchTerm.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(term) ||
      cat.slug.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    if (!formData.slug || !formData.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setFormLoading(true);

    try {
      let response;
      const submitData = {
        name: formData.name.trim(),
        slug: formData.slug.toLowerCase().replace(/\s+/g, '-').trim(),
        image: formData.image || ""
      };

      if (editingId) {
        response = await axios.put(
          backendUrl + "/api/category/" + editingId,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          backendUrl + "/api/category",
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        toast.success(response.data.message || (editingId ? "Category updated!" : "Category created!"));
        resetForm();
        fetchCategories();
      } else {
        toast.error(response.data.message || "Failed to save category");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to save category. Please try again.";
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    const { id } = deleteModal;
    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      const response = await axios.delete(
        backendUrl + "/api/category/" + id,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(response.data.imageDeleted 
          ? "Category and its assets deleted successfully!" 
          : "Category deleted successfully!"
        );
        setDeleteModal({ isOpen: false, id: null, name: '', loading: false });
        fetchCategories();
      } else {
        toast.error(response.data.message || "Failed to delete");
        setDeleteModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete category");
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const resetForm = () => {
    setFormData({ name: "", slug: "", image: "" });
    setImagePreview("");
    setIsAdding(false);
    setEditingId(null);
    setFormLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startEdit = (category) => {
    setFormData({ 
      name: category.name, 
      slug: category.slug, 
      image: "" 
    });
    setImagePreview(category.image || "");
    setEditingId(category._id);
    setIsAdding(true);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  useEffect(() => {
    fetchCategories();
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
          <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          <p className="text-sm text-gray-500">Manage your product categories</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAdding(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition text-sm w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., PUBG MOBILE"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
                  required
                  disabled={formLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Slug *
                </label>
                <input
                  type="text"
                  placeholder="e.g. pubg-mobile"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category Image *
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  disabled={formLoading}
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition cursor-pointer text-sm"
                >
                  <Image size={16} />
                  Choose Image
                </label>
                {(imagePreview || formData.image) && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <img 
                      src={imagePreview || formData.image} 
                      alt="Preview" 
                      className="w-12 h-12 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("");
                        setFormData(prev => ({ ...prev, image: "" }));
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Recommended: Square image, max 5MB</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={formLoading}
                className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {editingId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingId ? 'Update Category' : 'Create Category'
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition text-sm w-full sm:w-auto"
                disabled={formLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 mt-2">
            Found {filteredCategories.length} category{filteredCategories.length !== 1 ? 'ies' : ''} matching "{searchTerm}"
          </p>
        )}
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-500">
            {searchTerm ? `No categories found matching "${searchTerm}"` : "No categories found"}
          </p>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => (
            <div key={cat._id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition">
              <div className="flex items-start gap-3">
                {cat.image ? (
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-14 h-14 object-cover rounded border flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded border flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-xs">No img</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{cat.name}</h4>
                  <p className="text-sm text-gray-500 truncate">/{cat.slug}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => startEdit(cat)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteModal({ isOpen: true, id: cat._id, name: cat.name })}
                  className="ml-auto flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '', loading: false })}
        onConfirm={handleDelete}
        title="Category"
        itemName={deleteModal.name}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default Categories;