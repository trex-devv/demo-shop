// admin/src/pages/Subscriptions.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { 
  Edit, Trash2, Loader2, Search, X, 
  Plus, ChevronDown, Eye, EyeOff, Star, Award,
  CheckCircle, XCircle, Calendar, Link2, Package, ArrowUpDown, Tag
} from "lucide-react";
import DeleteModal from "../components/UI/DeleteModal";
import { Link, useNavigate } from "react-router-dom";

const Subscriptions = ({ token }) => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [viewModal, setViewModal] = useState({ isOpen: false, subscription: null });

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + "/api/subscription");
      if (response.data.success) {
        setSubscriptions(response.data.subscriptions || []);
      }
    } catch (error) {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    let filtered = [...subscriptions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term) ||
        s.provider?.toLowerCase().includes(term) ||
        s.category?.toLowerCase().includes(term)
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter(s => s.category === filterCategory);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(s => 
        filterStatus === "active" ? s.isActive : !s.isActive
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
          const minA = Math.min(...a.variants.map(v => v.price));
          const minB = Math.min(...b.variants.map(v => v.price));
          return minA - minB;
        });
        break;
      case "price-high":
        filtered.sort((a, b) => {
          const minA = Math.min(...a.variants.map(v => v.price));
          const minB = Math.min(...b.variants.map(v => v.price));
          return minB - minA;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [subscriptions, searchTerm, filterCategory, filterStatus, sortBy]);

  const handleDelete = async () => {
    const { id } = deleteModal;
    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      const response = await axios.delete(
        backendUrl + "/api/subscription/" + id,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(response.data.message || "Subscription deleted successfully!");
        setDeleteModal({ isOpen: false, id: null, name: '', loading: false });
        fetchSubscriptions();
      } else {
        toast.error(response.data.message || "Failed to delete");
        setDeleteModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete subscription");
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/subscription/${id}`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(`Subscription ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchSubscriptions();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterStatus("all");
    setSortBy("newest");
  };

  const getDurationLabel = (duration) => {
    const labels = {
      'monthly': 'Monthly',
      '3-months': '3 Months',
      '6-months': '6 Months',
      'yearly': 'Yearly'
    };
    return labels[duration] || duration;
  };

  const categoryOptions = ['Streaming', 'Music', 'Gaming', 'Shopping', 'Productivity', 'Other'];

  const handleCardClick = (subscription) => {
    setViewModal({ isOpen: true, subscription });
  };

  const handleEditClick = (e, subscriptionId) => {
    e.stopPropagation();
    navigate(`/subscriptions/edit/${subscriptionId}`);
  };

  const handleDeleteClick = (e, subscription) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, id: subscription._id, name: subscription.name });
  };

  // View Subscription Modal
  const ViewSubscriptionModal = () => {
  if (!viewModal.isOpen || !viewModal.subscription) return null;

  const sub = viewModal.subscription;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => setViewModal({ isOpen: false, subscription: null })}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Subscription Details</h3>
              <p className="text-sm text-gray-500">{sub.name || ''}</p>
            </div>
          </div>
          <button
            onClick={() => setViewModal({ isOpen: false, subscription: null })}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Images */}
          {sub.images && sub.images.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {sub.images.map((img, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img 
                    src={img.secure_url} 
                    alt={`${sub.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</label>
              <p className="text-gray-900 font-medium mt-1">{sub.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</label>
              <p className="text-gray-900 mt-1">{sub.provider || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</label>
              <p className="text-gray-900 mt-1">{sub.category}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
              <div className="mt-1">
                {sub.isActive ? (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700 inline-flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Active
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700 inline-flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
            {sub.isPopular && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Popular</label>
                <div className="mt-1">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700 inline-flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" />
                    Popular
                  </span>
                </div>
              </div>
            )}
            {sub.providerWebsite && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Website</label>
                <div>
                  <a 
                    href={sub.providerWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-sm mt-1 inline-flex items-center gap-1"
                  >
                    {sub.providerWebsite}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Plans</h4>
            <div className="grid grid-cols-2 gap-3">
              {sub.variants && sub.variants.map((variant, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="font-medium text-gray-900">{variant.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">Rs. {variant.price}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{getDurationLabel(variant.duration)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {sub.description && (
            <div className="pt-4 border-t border-gray-100">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
              <p className="text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">
                {sub.description}
              </p>
            </div>
          )}

          {/* Features */}
          {sub.features && sub.features.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Features</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {sub.features.map((feature, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 pb-16 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created: {new Date(sub.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Updated: {new Date(sub.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Actions - Fixed position at bottom */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <Link
            to={`/subscriptions/edit/${sub._id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition text-sm"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={() => {
              setViewModal({ isOpen: false, subscription: null });
              toggleStatus(sub._id, sub.isActive);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-md transition text-sm ${
              sub.isActive 
                ? 'border-orange-300 text-orange-600 hover:bg-orange-50' 
                : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {sub.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {sub.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => {
              setViewModal({ isOpen: false, subscription: null });
              setDeleteModal({ isOpen: true, id: sub._id, name: sub.name });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition text-sm ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

  if (loading) {
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
          <h3 className="text-xl sm:text-lg font-semibold text-gray-900">Subscriptions</h3>
          <p className="text-sm sm:text-sm text-gray-500 mt-0.5">Manage your subscription plans</p>
        </div>
        <Link
          to="/subscriptions/add"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search subscriptions..."
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
              className="w-full px-4 py-2.5 sm:py-2 pr-9 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-sm appearance-none bg-white"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[130px] sm:min-w-[140px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-2 pr-9 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-sm appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>

          {/* Sort Filter */}
          <div className="relative min-w-[130px] sm:min-w-[140px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-2 pr-9 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-sm appearance-none bg-white"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name (A-Z)</option>
              <option value="price-low">Price (Low-High)</option>
              <option value="price-high">Price (High-Low)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>

          {/* Clear Filters */}
          {(searchTerm || filterCategory !== "all" || filterStatus !== "all") && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition whitespace-nowrap"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-2 text-sm sm:text-sm text-gray-500">
          <span>{filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? 's' : ''} found</span>
        </div>
      </div>

      {/* Subscriptions Grid */}
      {filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-200">
          <Award className="w-14 h-14 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-base sm:text-sm text-gray-500">
            {searchTerm ? `No subscriptions found matching "${searchTerm}"` : "No subscriptions found"}
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
          {filteredSubscriptions.map((subscription) => (
            <div 
              key={subscription._id} 
              onClick={() => handleCardClick(subscription)}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {subscription.images?.[0]?.secure_url ? (
                  <img 
                    src={subscription.images[0].secure_url} 
                    alt={subscription.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {subscription.isPopular && (
                    <span className="text-[10px] sm:text-[10px] px-2 py-0.5 rounded-full font-medium bg-yellow-400 text-black inline-flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Popular
                    </span>
                  )}
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className={`text-[10px] sm:text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    subscription.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {subscription.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Actions - visible on hover */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => handleEditClick(e, subscription._id)}
                    className="p-1.5 sm:p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, subscription)}
                    className="p-1.5 sm:p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4">
                <h4 className="font-medium text-sm sm:text-sm text-gray-900 truncate">{subscription.name}</h4>
                {subscription.provider && (
                  <p className="text-xs sm:text-xs text-gray-500 truncate">{subscription.provider}</p>
                )}
                
                {/* Pricing */}
                <div className="mt-1.5 sm:mt-2 flex items-center justify-between">
                  <span className="text-base sm:text-base lg:text-lg font-semibold text-gray-900">
                    Rs. {Math.min(...subscription.variants.map(v => v.price))}
                  </span>
                  <span className="text-[11px] sm:text-[10px] text-gray-400">
                    {subscription.variants.length} plans
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <ViewSubscriptionModal />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '', loading: false })}
        onConfirm={handleDelete}
        title="Subscription"
        itemName={deleteModal.name}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default Subscriptions;