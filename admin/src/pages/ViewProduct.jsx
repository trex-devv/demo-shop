import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { 
  ArrowLeft, Edit, Trash2, Loader2, Package, 
  ShoppingBag, Tag, Layers, Calendar, CheckCircle, XCircle
} from "lucide-react";
import DeleteModal from "../components/UI/DeleteModal";

const ViewProduct = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + "/api/product/" + id);
      if (response.data.success) {
        setProduct(response.data.product);
      } else {
        toast.error("Product not found");
        navigate("/list");
      }
    } catch (error) {
      toast.error("Failed to load product");
      navigate("/list");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      const response = await axios.delete(
        backendUrl + "/api/product/" + id,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success("Product deleted successfully!");
        setDeleteModal({ isOpen: false, id: null, name: '', loading: false });
        navigate("/list");
      } else {
        toast.error(response.data.message || "Failed to delete");
        setDeleteModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete product");
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Product not found</p>
        <Link to="/list" className="text-gray-600 hover:text-gray-900 underline mt-2 inline-block">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Link
            to="/list"
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500">Product Details</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            to={`/edit/${product._id}`}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <Edit size={16} />
            <span>Edit</span>
          </Link>
          <button
            onClick={() => setDeleteModal({ isOpen: true, id: product._id, name: product.name })}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Images - Responsive Grid */}
        {product.images && product.images.length > 0 && (
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {product.images.map((img, index) => (
                <div key={index} className="aspect-square w-full rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={img.secure_url}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</label>
              <p className="text-sm sm:text-base text-gray-900 font-medium mt-0.5 sm:mt-1 break-words">{product.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                {product.inStock ? (
                  <>
                    <CheckCircle size={18} className="text-green-600" />
                    <span className="text-sm sm:text-base text-green-600 font-medium">In Stock</span>
                  </>
                ) : (
                  <>
                    <XCircle size={18} className="text-red-600" />
                    <span className="text-sm sm:text-base text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Tag size={16} className="text-gray-400" />
                Category
              </label>
              <p className="text-sm sm:text-base text-gray-900 mt-0.5 sm:mt-1 break-words">{product.category?.name || "N/A"}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Layers size={16} className="text-gray-400" />
                Subcategory
              </label>
              <p className="text-sm sm:text-base text-gray-900 mt-0.5 sm:mt-1 break-words">{product.subCategory?.name || "N/A"}</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="pt-3 sm:pt-4 border-t border-gray-100">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <ShoppingBag size={16} className="text-gray-400" />
              Pricing
            </label>
            {product.pricingType === "flat" ? (
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {currency}{product.price?.toFixed(2)}
              </p>
            ) : (
              <div className="mt-1">
                <p className="text-xs sm:text-sm text-gray-500 mb-2">{product.variants?.length} variants available</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {product.variants?.map((variant, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">{variant.label}</p>
                      <p className="text-sm sm:text-lg font-semibold text-gray-900">{currency}{variant.price?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-3 sm:pt-4 border-t border-gray-100">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
              <p className="text-sm sm:text-base text-gray-700 mt-0.5 sm:mt-1 whitespace-pre-wrap break-words leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-3 sm:pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar size={16} className="text-gray-400" />
              <span>Created: {new Date(product.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={16} className="text-gray-400" />
              <span>Updated: {new Date(product.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '', loading: false })}
        onConfirm={handleDelete}
        title="Product"
        itemName={deleteModal.name}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default ViewProduct;