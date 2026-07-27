// admin/src/pages/Orders.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import {
  Package, Clock, CheckCircle, XCircle, 
  Search, ChevronDown, Calendar, CreditCard, User,
  Loader2, RefreshCw, ShoppingBag, ArrowRight,
  TrendingUp, TrendingDown, ShoppingCart, ArrowUpDown,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { timeAgo } from "../utils/dateUtils";

const STATUS_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: "Pending Verification", label: "Pending" },
  { value: "Payment Verified", label: "Verified" },
  { value: "Delivered", label: "Delivered" },
  { value: "Payment Rejected", label: "Rejected" },
  { value: "Cancelled", label: "Cancelled" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest", label: "Highest Price" },
  { value: "lowest", label: "Lowest Price" },
];

const STATUS_STYLES = {
  "Pending Verification": "bg-amber-50 text-amber-700 border-amber-200",
  "Payment Verified": "bg-blue-50 text-blue-700 border-blue-200",
  "Delivered": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Payment Rejected": "bg-red-50 text-red-700 border-red-200",
  "Cancelled": "bg-gray-100 text-gray-600 border-gray-300",
};

const STATUS_DOT_COLORS = {
  "Pending Verification": "bg-amber-400",
  "Payment Verified": "bg-blue-400",
  "Delivered": "bg-emerald-400",
  "Payment Rejected": "bg-red-400",
  "Cancelled": "bg-gray-400",
};

const ORDERS_PER_PAGE = 30;

const Orders = ({ token }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [productImages, setProductImages] = useState({});
  const [subscriptionImages, setSubscriptionImages] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + "/api/order/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const list = response.data.orders || [];
        setOrders(list);
        await fetchProductImages(list);
        await fetchSubscriptionImages(list);
        setCurrentPage(1);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductImages = async (orderList) => {
    const imageMap = {};
    for (const order of orderList) {
      if (!order?.items) continue;
      for (const item of order.items) {
        if (!item.isSubscription && item.productId && !imageMap[item.productId]) {
          try {
            const response = await axios.get(`${backendUrl}/api/product/${item.productId}`);
            if (response.data.success && response.data.product?.images?.[0]?.secure_url) {
              imageMap[item.productId] = response.data.product.images[0].secure_url;
            }
          } catch (error) {
          }
        }
      }
    }
    setProductImages(imageMap);
  };

  const fetchSubscriptionImages = async (orderList) => {
    const imageMap = {};
    for (const order of orderList) {
      if (!order?.items) continue;
      for (const item of order.items) {
        if (item.isSubscription && item.subscriptionId && !imageMap[item.subscriptionId]) {
          try {
            const response = await axios.get(`${backendUrl}/api/subscription/${item.subscriptionId}`);
            if (response.data.success && response.data.subscription?.images?.[0]?.secure_url) {
              imageMap[item.subscriptionId] = response.data.subscription.images[0].secure_url;
            }
          } catch (error) {
          }
        }
      }
    }
    setSubscriptionImages(imageMap);
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const getItemImage = (item) => {
    if (item.isSubscription) {
      return item.subscriptionId ? subscriptionImages[item.subscriptionId] : null;
    }
    return item.productId ? productImages[item.productId] : null;
  };

  const getStatusDot = (status) => {
    return STATUS_DOT_COLORS[status] || "bg-gray-400";
  };

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(term) ||
          o.userId?.name?.toLowerCase().includes(term) ||
          o.items?.some((item) => item.name.toLowerCase().includes(term))
      );
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date));
        break;
      case "highest":
        sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        break;
      case "lowest":
        sorted.sort((a, b) => (a.amount || 0) - (b.amount || 0));
        break;
      default:
        break;
    }
    
    return sorted;
  }, [orders, filterStatus, searchTerm, sortBy]);

  const totalOrders = filteredAndSortedOrders.length;
  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const currentOrders = filteredAndSortedOrders.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.getElementById('orders-list')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === "Pending Verification").length;
    const verified = orders.filter(o => o.status === "Payment Verified").length;
    const delivered = orders.filter(o => o.status === "Delivered").length;
    const rejected = orders.filter(o => o.status === "Payment Rejected" || o.status === "Cancelled").length;
    
    return { total, pending, verified, delivered, rejected };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-full px-1 py-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
          <p className="text-sm text-gray-500">Manage and track all customer orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 rounded-lg hover:bg-gray-50 transition flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</span>
            <span className="text-xs text-gray-400 mb-0.5">orders</span>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">Pending</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pending}</span>
            <span className="text-xs text-gray-400 mb-0.5">orders</span>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-500 uppercase tracking-wider">Verified</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.verified}</span>
            <span className="text-xs text-gray-400 mb-0.5">orders</span>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Delivered</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.delivered}</span>
            <span className="text-xs text-gray-400 mb-0.5">orders</span>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-500 uppercase tracking-wider">Rejected</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.rejected}</span>
            <span className="text-xs text-gray-400 mb-0.5">orders</span>
          </div>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
          <input
            type="text"
            placeholder="Search orders, customers, or products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm bg-white/80 backdrop-blur-sm transition-all"
          />
        </div>
        <div className="relative min-w-[160px]">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm appearance-none bg-white/80 backdrop-blur-sm transition-all"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={18} />
        </div>
        <div className="relative min-w-[160px]">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm appearance-none bg-white/80 backdrop-blur-sm transition-all"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
        </div>
      </div>

      {/* Orders Grid */}
      <div id="orders-list">
        {currentOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No orders found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 gap-4 space-y-4">
              {currentOrders.map((order) => {
                const statusDot = getStatusDot(order.status);
                const firstItem = order.items?.[0];
                const firstItemImage = firstItem ? getItemImage(firstItem) : null;
                const totalQty = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                const itemCount = order.items?.length || 0;

                return (
                  <div
                    key={order._id}
                    onClick={() => handleOrderClick(order._id)}
                    className="group bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden break-inside-avoid mb-4"
                  >
                    <div className="p-4 sm:p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* First Product Image */}
                          <div className="flex-shrink-0">
                            {firstItemImage ? (
                              <img 
                                src={firstItemImage} 
                                alt={firstItem?.name || 'Product'}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Order Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-gray-900 truncate">
                                #{order.orderNumber || order._id?.slice(-6)}
                              </span>
                              <div className={`w-1.5 h-1.5 rounded-full ${statusDot} flex-shrink-0`}></div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span className="text-xs text-gray-500 truncate">
                                by {order.userId?.name || "Unknown"}
                              </span>
                              <span className="text-gray-300">·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(order.createdAt || order.date)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-bold text-gray-900">
                            {currency}{order.amount?.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {totalQty} {totalQty === 1 ? "item" : "items"}
                          </div>
                        </div>
                      </div>

                      {/* Products List */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="space-y-1.5">
                          {order.items?.slice(0, 4).map((item, idx) => {
                            const variantValue = item.variant || item.variantLabel;
                            const hasVariant = variantValue && variantValue !== 'null' && variantValue !== '';
                            
                            return (
                              <div 
                                key={idx} 
                                className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1 rounded"
                              >                            
                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                  <span className="text-xs text-gray-700 truncate">
                                    {item.name}
                                  </span>
                                  {hasVariant && (
                                    <span className="text-[10px] font-medium text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded-lg border border-blue-100 flex-shrink-0">
                                      {variantValue}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400 flex-shrink-0">
                                    ×{item.quantity}
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-gray-600 flex-shrink-0">
                                  {currency}{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {itemCount > 4 && (
                          <div className="mt-1.5 text-xs text-gray-400">
                            +{itemCount - 4} more items
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || "bg-gray-100 text-gray-600"}`}>
                            {order.status}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {order.paymentMethod || "QR"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <span className="hidden sm:inline">View details</span>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, totalOrders)}</span> of{' '}
                  <span className="font-medium">{totalOrders}</span> orders
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all ${
                      currentPage === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-all ${
                            currentPage === pageNum
                              ? 'bg-black text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all ${
                      currentPage === totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;