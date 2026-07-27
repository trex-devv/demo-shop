// admin/src/pages/Products.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { 
  Edit, Trash2, Loader2, Search, X, 
  Package, Plus, ChevronDown
} from "lucide-react";
import DeleteModal from "../components/UI/DeleteModal";
import { Link, useNavigate } from "react-router-dom";

const Products = ({ token }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/category");
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + "/api/product");
      if (response.data.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.category?.name?.toLowerCase().includes(term)
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter(p => 
        p.category?._id === filterCategory || p.category === filterCategory
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(p => 
        filterStatus === "instock" ? p.inStock : !p.inStock
      );
    }

    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price-low":
        filtered.sort((a, b) => {
          const priceA = a.pricingType === "flat" ? a.price : Math.min(...(a.variants?.map(v => v.price) || [0]));
          const priceB = b.pricingType === "flat" ? b.price : Math.min(...(b.variants?.map(v => v.price) || [0]));
          return priceA - priceB;
        });
        break;
      case "price-high":
        filtered.sort((a, b) => {
          const priceA = a.pricingType === "flat" ? a.price : Math.min(...(a.variants?.map(v => v.price) || [0]));
          const priceB = b.pricingType === "flat" ? b.price : Math.min(...(b.variants?.map(v => v.price) || [0]));
          return priceB - priceA;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [products, searchTerm, filterCategory, filterStatus, sortBy]);

  const handleDelete = async () => {
    const { id } = deleteModal;
    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      const response = await axios.delete(
        backendUrl + "/api/product/" + id,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(response.data.message || "Product deleted successfully!");
        setDeleteModal({ isOpen: false, id: null, name: '', loading: false });
        fetchProducts();
      } else {
        toast.error(response.data.message || "Failed to delete");
        setDeleteModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete product");
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterStatus("all");
    setSortBy("newest");
  };

  const getPriceDisplay = (product) => {
    if (product.pricingType === "flat") {
      return `${currency}${product.price?.toFixed(2)}`;
    } else {
      const prices = product.variants?.map(v => v.price) || [];
      if (prices.length === 0) return `${currency}0.00`;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? `${currency}${min.toFixed(2)}` : `${currency}${min.toFixed(2)} - ${currency}${max.toFixed(2)}`;
    }
  };

  const getVariantCount = (product) => {
    if (product.pricingType === "variants") {
      return product.variants?.length || 0;
    }
    return 0;
  };

  // Handle card click to view product
  const handleCardClick = (productId) => {
    navigate(`/view/${productId}`);
  };

  const handleEditClick = (e, productId) => {
    e.stopPropagation();
    navigate(`/edit/${productId}`);
  };

  const handleDeleteClick = (e, product) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, id: product._id, name: product.name });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-4 md:px-0 py-5 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 sm:mb-6">
        <div>
          <h3 className="text-xl sm:text-lg font-semibold text-gray-900">Products</h3>
          <p className="text-sm sm:text-sm text-gray-500 mt-0.5">Manage your product inventory</p>
        </div>
        <Link
          to="/add"
          className="flex items-center justify-center gap-2 px-5 py-2.5 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="mb-5 sm:mb-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm sm:text-sm bg-white/80 backdrop-blur-sm transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[140px] sm:min-w-[160px]">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-2 pr-9 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm appearance-none bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[130px] sm:min-w-[140px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-2 pr-9 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="instock">In Stock</option>
              <option value="outofstock">Out of Stock</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>

          {/* Sort */}
          <div className="relative min-w-[130px] sm:min-w-[140px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-2 pr-9 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm appearance-none bg-white"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name (A-Z)</option>
              <option value="price-low">Price (Low-High)</option>
              <option value="price-high">Price (High-Low)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>
        </div>

        {/* Filter Status Bar */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-sm sm:text-sm text-gray-500">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </span>
          {(searchTerm || filterCategory !== "all" || filterStatus !== "all") && (
            <button
              onClick={clearFilters}
              className="text-sm sm:text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-200">
          <Package className="w-14 h-14 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-base sm:text-sm text-gray-500">
            {searchTerm ? `No products found matching "${searchTerm}"` : "No products found"}
          </p>
          {searchTerm && (
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <div 
              key={product._id} 
              onClick={() => handleCardClick(product._id)}
              className="border border-gray-200 rounded-xl bg-white hover:shadow-md transition overflow-hidden cursor-pointer group"
            >
              {/* Image - Square */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {product.images?.[0]?.secure_url ? (
                  <img 
                    src={product.images[0].secure_url} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
                  </div>
                )}
                
                {/* Stock Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`text-[11px] sm:text-[10px] px-2 sm:px-1.5 py-0.5 rounded-full font-medium ${
                    product.inStock 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                {product.pricingType === "variants" && product.variants?.length > 0 && (
                  <span className="absolute bottom-2 right-3 text-[11px] sm:text-[14px] font-medium text-gray-300">
                    {product.variants.length} variants
                  </span>
                )}

                {/* Action Buttons - Always visible on mobile, hover on desktop */}
                <div className="absolute top-2 right-2 flex gap-1.5 sm:gap-1">
                  <button
                    onClick={(e) => handleEditClick(e, product._id)}
                    className="p-2 sm:p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition"
                    title="Edit product"
                  >
                    <Edit size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, product)}
                    className="p-2 sm:p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 transition"
                    title="Delete product"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4">
                <h4 className="text-sm sm:text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                {product.category && (
                  <p className="text-xs sm:text-xs text-gray-500 truncate">{product.category.name}</p>
                )}
                <div className="mt-1.5 sm:mt-2 flex items-center justify-between">
                  <span className="text-base sm:text-base lg:text-lg font-semibold text-gray-900">
                    {getPriceDisplay(product)}
                  </span>
                </div>
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
        title="Product"
        itemName={deleteModal.name}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default Products;