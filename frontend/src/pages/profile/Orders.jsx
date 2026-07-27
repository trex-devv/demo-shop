import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../../contexts/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Package, Clock, CheckCircle2, AlertTriangle, XCircle,
  ShoppingBag, RefreshCw, X, ChevronDown,
  Loader2, Eye, MessageCircle,
  Ticket, AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_CONFIG = {
  "Delivered": { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", label: "Delivered", icon: CheckCircle2 },
  "Payment Verified": { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", label: "Verified", icon: CheckCircle2 },
  "Pending Verification": { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", label: "Pending verification", icon: Clock },
  "Payment Rejected": { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", label: "Payment rejected", icon: XCircle },
  "Cancelled": { dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-100", label: "Cancelled", icon: XCircle },
  "Disputed": { dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50", label: "Disputed", icon: AlertTriangle },
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG["Pending Verification"];

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const Orders = () => {
  const { currency, backendUrl, token } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [productImages, setProductImages] = useState({});
  const [subscriptionImages, setSubscriptionImages] = useState({});

  // Ticket Modal States
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedOrderForTicket, setSelectedOrderForTicket] = useState(null);
  const [ticketType, setTicketType] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketTypes] = useState([
    { value: 'Item Not Delivered', label: 'Item Not Delivered' },
    { value: 'Wrong Item Received', label: 'Wrong Item Received' },
    { value: 'Missing Items', label: 'Missing Items' },
    { value: 'Delayed Delivery', label: 'Delayed Delivery' },
    { value: 'Wrong Details Submitted', label: 'Wrong Details Submitted' },
    { value: 'Items Not Received In-Game', label: 'Items Not Received In-Game' },
    { value: 'Payment Not Verified', label: 'Payment Not Verified' },
    { value: 'Other', label: 'Other' }
  ]);

  // Screenshot viewer
  const [screenshotView, setScreenshotView] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [token]);

  const loadOrders = async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    try {
      const response = await axios.get(backendUrl + "/api/order/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        const ordersData = response.data.orders || [];
        setOrders(ordersData);
        fetchImagesForOrders(ordersData);
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchImagesForOrders = async (ordersData) => {
    const productImageMap = {};
    const subscriptionImageMap = {};

    for (const order of ordersData) {
      if (!order?.items) continue;
      for (const item of order.items) {
        if (!item.isSubscription && item.productId && !productImageMap[item.productId]) {
          try {
            const response = await axios.get(`${backendUrl}/api/product/${item.productId}`);
            if (response.data.success && response.data.product?.images?.[0]?.secure_url) {
              productImageMap[item.productId] = response.data.product.images[0].secure_url;
            }
          } catch (error) {}
        }

        if (item.isSubscription && item.subscriptionId && !subscriptionImageMap[item.subscriptionId]) {
          try {
            const response = await axios.get(`${backendUrl}/api/subscription/${item.subscriptionId}`);
            if (response.data.success && response.data.subscription?.images?.[0]?.secure_url) {
              subscriptionImageMap[item.subscriptionId] = response.data.subscription.images[0].secure_url;
            }
          } catch (error) {}
        }
      }
    }

    setProductImages(productImageMap);
    setSubscriptionImages(subscriptionImageMap);
  };

  const getItemImage = (item) => {
    if (item.isSubscription) {
      return item.subscriptionId ? subscriptionImages[item.subscriptionId] : null;
    }
    return item.productId ? productImages[item.productId] : null;
  };

  // Handle ticket submission
  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketType || !ticketDescription || !selectedOrderForTicket) return;

    setSubmittingTicket(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/ticket`,
        {
          orderId: selectedOrderForTicket._id,
          type: ticketType,
          description: ticketDescription,
          attachments: []
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Support ticket created successfully");
        setTicketModalOpen(false);
        setTicketType("");
        setTicketDescription("");
        setSelectedOrderForTicket(null);
        // Refresh orders to update ticket count
        loadOrders();
      } else {
        toast.error(response.data.message || "Failed to create ticket");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <p className="text-gray-400 text-sm">Loading your orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
        </div>
        <button
          onClick={() => loadOrders(true)}
          disabled={refreshing}
          aria-label="Refresh orders"
          className="self-start sm:self-auto p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 sm:py-20 border border-dashed border-gray-200 rounded-2xl">
          <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-medium text-gray-900 mb-1">No orders yet</h3>
          <p className="text-gray-400 text-sm mb-6">Everything you order will show up here.</p>
          <Link
            to="/collection"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedOrder === order._id;
            const itemCount = order.items?.length || 0;
            const hasScreenshot = order.paymentProof?.screenshotUrl && order.paymentProof?.screenshotUrl !== 'cod-payment';

            return (
              <div
                key={order._id}
                className={`bg-white rounded-xl sm:rounded-2xl border transition-all duration-200 ${
                  isExpanded ? " shadow-md" : "shadow-sm hover:scale-[1.002]"
                } ${order.isCancelled ? "opacity-75" : ""}`}
              >
                {/* Row - Click to expand */}
                <button
                  onClick={() => toggleExpand(order._id)}
                  className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 text-left"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        #{order.orderNumber || order._id.slice(-8)}
                      </span>
                      {order.isCancelled && (
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          Cancelled
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{formatDate(order.createdAt)}</span>
                      <span className="hidden xs:inline">·</span>
                      <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                    </div>
                  </div>

                  {/* Status + price */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      <span className="hidden xs:inline">{statusConfig.label}</span>
                      <span className="xs:hidden">
                        {statusConfig.label === "Pending verification" ? "Pending" : 
                         statusConfig.label === "Payment rejected" ? "Rejected" :
                         statusConfig.label.split(" ")[0]}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {currency}{order.amount?.toFixed(2)}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 animate-fadeIn">
                    <div className="border-t border-gray-100 pt-3 sm:pt-4">
                      {/* Items */}
                      <div className="flex flex-col gap-3 mb-4 overflow-y-auto pr-1 max-h-[300px]">
                        {order.items?.map((item, idx) => {
                          const imgUrl = getItemImage(item);
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                {imgUrl ? (
                                  <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <Package className="w-4 h-4 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                {item.variant && <p className="text-xs text-gray-400 truncate">{item.variant}</p>}
                              </div>
                              <div className="text-right text-sm flex-shrink-0">
                                <p className="text-gray-400 text-xs">×{item.quantity}</p>
                                <p className="font-medium text-gray-900">
                                  {currency}{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order cancelled info */}
                      {order.isCancelled && (
                        <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Cancelled:</span> {order.cancellationNote || order.cancellationReason || 'No reason provided'}
                          </p>
                          {order.cancelledAt && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(order.cancelledAt)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {/* View Payment Screenshot */}
                        {hasScreenshot && (
                          <button
                            onClick={() => setScreenshotView(order.paymentProof.screenshotUrl)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            <span>View Payment Screenshot</span>
                          </button>
                        )}

                        {/* Report Issue - Create Ticket */}
                        {!order.isCancelled && order.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              setSelectedOrderForTicket(order);
                              setTicketModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                          >
                            <MessageCircle size={14} />
                            <span>Report Issue</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Ticket / Report Issue Modal */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setTicketModalOpen(false);
              setTicketType("");
              setTicketDescription("");
              setSelectedOrderForTicket(null);
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Report Issue</h3>
                <p className="text-xs sm:text-sm text-gray-500">Create a support ticket for this order</p>
              </div>
              <button
                onClick={() => {
                  setTicketModalOpen(false);
                  setTicketType("");
                  setTicketDescription("");
                  setSelectedOrderForTicket(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4">
              <form onSubmit={handleTicketSubmit}>
                {/* Order Info */}
                {selectedOrderForTicket && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                      <ShoppingBag size={13} />
                      <span className="font-medium uppercase tracking-wider">Order Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <div>
                        <span className="text-gray-500">Order #</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {selectedOrderForTicket.orderNumber || selectedOrderForTicket._id.slice(-8)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {currency}{selectedOrderForTicket.amount?.toFixed(2)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Status</span>
                        <span className={`ml-1.5 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                          selectedOrderForTicket.status === 'Delivered' ? 'bg-green-50 text-green-700' :
                          selectedOrderForTicket.status === 'Payment Verified' ? 'bg-blue-50 text-blue-700' :
                          selectedOrderForTicket.status === 'Pending Verification' ? 'bg-yellow-50 text-yellow-700' :
                          selectedOrderForTicket.status === 'Payment Rejected' ? 'bg-red-50 text-red-700' :
                          selectedOrderForTicket.status === 'Cancelled' ? 'bg-gray-100 text-gray-600' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            selectedOrderForTicket.status === 'Delivered' ? 'bg-green-500' :
                            selectedOrderForTicket.status === 'Payment Verified' ? 'bg-blue-500' :
                            selectedOrderForTicket.status === 'Pending Verification' ? 'bg-yellow-500' :
                            selectedOrderForTicket.status === 'Payment Rejected' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} />
                          {selectedOrderForTicket.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Issue Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Issue Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ticketType}
                    onChange={(e) => setTicketType(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-colors bg-white"
                    required
                  >
                    <option value="">Select an issue type</option>
                    {ticketTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="3"
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Describe your issue..."
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-colors resize-none"
                    maxLength={500}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {ticketDescription.length}/500
                  </p>
                </div>

                {/* Ticket Limit */}
                <div className="mb-4 p-3 bg-amber-50/50 rounded-lg border border-amber-200/50">
                  <p className="text-xs text-amber-700">
                    <span className="font-medium">Note:</span> You can create up to 3 tickets per order.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col xs:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTicketModalOpen(false);
                      setTicketType("");
                      setTicketDescription("");
                      setSelectedOrderForTicket(null);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTicket || !ticketType || !ticketDescription}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingTicket ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Submitting…
                      </span>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Viewer */}
      {screenshotView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-4"
          onClick={() => setScreenshotView(null)}
        >
          <button
            onClick={() => setScreenshotView(null)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={24} className="sm:hidden" />
            <X size={28} className="hidden sm:block" />
          </button>
          <img
            src={screenshotView}
            alt="Payment receipt"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
        @media (max-width: 400px) {
          .xs\\:inline {
            display: inline !important;
          }
          .xs\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Orders;