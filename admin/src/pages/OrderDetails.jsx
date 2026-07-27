import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import {
  ArrowLeft, Package, Clock, CheckCircle, XCircle,
  User, Mail, Phone, CreditCard, Image,
  ShoppingBag, Truck, DollarSign, AlertTriangle,
  Copy, Loader2, RefreshCw, Shield, X,
  FileText, BadgeCheck, CircleCheck, CircleX, Timer,
  CalendarDays, MapPin, Building2, Hash, ExternalLink
} from "lucide-react";
import { timeAgo } from "../utils/dateUtils";

const STATUS_STYLES = {
  "Pending Verification": "bg-amber-500/10 text-amber-600 border-amber-200",
  "Payment Verified": "bg-blue-500/10 text-blue-600 border-blue-200",
  "Delivered": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "Payment Rejected": "bg-red-500/10 text-red-600 border-red-200",
  "Cancelled": "bg-gray-500/10 text-gray-600 border-gray-200",
};

const STATUS_ICONS = {
  "Pending Verification": Timer,
  "Payment Verified": BadgeCheck,
  "Delivered": CircleCheck,
  "Payment Rejected": CircleX,
  "Cancelled": XCircle,
};

const OrderDetails = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [productImages, setProductImages] = useState({});
  const [subscriptionImages, setSubscriptionImages] = useState({});
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);

  const fetchOrder = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + "/api/order/" + id, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const orderData = response.data.order;
        setOrder(orderData);
        await fetchImages(orderData);
      } else {
        toast.error(response.data.message);
        navigate("/orders");
      }
    } catch (error) {
      toast.error("Failed to load order details");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async (orderData) => {
    const productImageMap = {};
    const subscriptionImageMap = {};
    
    if (!orderData?.items) return;
    
    for (const item of orderData.items) {
      if (!item.isSubscription && item.productId && !productImageMap[item.productId]) {
        try {
          const response = await axios.get(`${backendUrl}/api/product/${item.productId}`);
          if (response.data.success && response.data.product?.images?.[0]?.secure_url) {
            productImageMap[item.productId] = response.data.product.images[0].secure_url;
          }
        } catch (error) {
        }
      }
      
      if (item.isSubscription && item.subscriptionId && !subscriptionImageMap[item.subscriptionId]) {
        try {
          const response = await axios.get(`${backendUrl}/api/subscription/${item.subscriptionId}`);
          if (response.data.success && response.data.subscription?.images?.[0]?.secure_url) {
            subscriptionImageMap[item.subscriptionId] = response.data.subscription.images[0].secure_url;
          }
        } catch (error) {
        }
      }
    }
    
    setProductImages(productImageMap);
    setSubscriptionImages(subscriptionImageMap);
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    if (updating) return;
    try {
      setUpdating(true);
      const response = await axios.put(
        backendUrl + "/api/order/" + id + "/status",
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Order marked as ${newStatus}`);
        await fetchOrder();
        setShowRejectModal(false);
        setShowRefundModal(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    await handleStatusUpdate("Payment Rejected");
  };

  const handleRefundConfirm = async () => {
    try {
      setUpdating(true);
      const response = await axios.put(
        backendUrl + "/api/order/" + id + "/refund",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Order refunded");
        await fetchOrder();
        setShowRefundModal(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to process refund");
    } finally {
      setUpdating(false);
    }
  };

  const getItemImage = (item) => {
    if (item.isSubscription) {
      return item.subscriptionId ? subscriptionImages[item.subscriptionId] : null;
    }
    return item.productId ? productImages[item.productId] : null;
  };

  const getStatusBadge = (status) => {
    return STATUS_STYLES[status] || "bg-gray-500/10 text-gray-600 border-gray-200";
  };

  const getStatusIcon = (status) => {
    return STATUS_ICONS[status] || Package;
  };

  const copyToClipboard = (text, label = "Copied") => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    toast.success(label);
  };

  const humanizeKey = (key) => {
    return key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getAvailableActions = (status) => {
    const actions = {
      "Pending Verification": [
        { label: "Verify Payment", action: "Payment Verified", color: "blue", icon: CheckCircle },
        { label: "Reject Order", action: "reject", color: "red", icon: XCircle },
      ],
      "Payment Verified": [
        { label: "Mark Delivered", action: "Delivered", color: "emerald", icon: Truck },
      ],
      "Cancelled": [
        { label: "Process Refund", action: "refund", color: "emerald", icon: DollarSign },
      ],
    };
    return actions[status] || [];
  };

  // Get product URL
  const getProductUrl = (item) => {
    if (item.isSubscription && item.subscriptionId) {
      return `/subscription/${item.subscriptionId}`;
    } else if (item.productId) {
      return `/product/${item.productId}`;
    }
    return null;
  };

  // Handle product card click
  const handleProductClick = (item, e) => {
    e.stopPropagation();
    const url = getProductUrl(item);
    if (url) {
      window.open(`http://localhost:5173${url}`, '_blank');
    } else {
      toast.info("Product link not available");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="text-base text-gray-500 font-medium">Loading order details...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">Order not found</p>
        <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Orders
        </Link>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(order.status);
  const statusBadge = getStatusBadge(order.status);
  const availableActions = getAvailableActions(order.status);

  return (
    <div className="min-h-screen bg-gray-50/50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/orders")}
              className="p-2 hover:bg-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Order #{order.orderNumber || order._id?.slice(-6)}
                </h1>
                <button
                  onClick={() => copyToClipboard(order.orderNumber, "Order number copied")}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {new Date(order.createdAt || order.date).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                <span className="h-1 w-1 bg-gray-300 rounded-full"/>
                {timeAgo(order.updatedAt || order.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={fetchOrder}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 rounded-xl transition-all hover:shadow-sm flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 ${statusBadge}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{order.status}</span>
          <span className="text-xs opacity-60 ml-1">· {timeAgo(order.updatedAt || order.createdAt)}</span>
          {updating && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
        </div>

        {/* Bento Grid - Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{currency}{order.amount?.toFixed(2)}</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Payment</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{order.paymentMethod || "N/A"}</p>
            {order.paymentProof?.screenshotUrl && (
              <button
                onClick={() => setShowPaymentProof(true)}
                className="text-sm px-4 py-1.5 bg-blue-500 text-white rounded-md mt-1 font-medium hover:bg-blue-600 transition-colors"
              >
                View Screenshot
              </button>
            )}
          </div>
          
          {/* Customer Detail - Updated with larger text and always visible copy button */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Customer Detail</p>
            {order.userId && (
              <div className="mt-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {order.userId.name}
                  </p>
                  <button
                    onClick={() => copyToClipboard(order.userId.name, "Name copied")}
                    className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0 md:opacity-0 md:group-hover:opacity-100"
                    title="Copy name"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {order.userId.email && (
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <p className="text-sm sm:text-base text-gray-600 truncate">
                      {order.userId.email}
                    </p>
                    <button
                      onClick={() => copyToClipboard(order.userId.email, "Email copied")}
                      className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0 md:opacity-0 md:group-hover:opacity-100"
                      title="Copy email"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {order.userId.phone && (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <p className="text-sm sm:text-base text-gray-600 truncate">
                      {order.userId.phone}
                    </p>
                    <button
                      onClick={() => copyToClipboard(order.userId.phone, "Phone copied")}
                      className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0 md:opacity-0 md:group-hover:opacity-100"
                      title="Copy phone"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Items</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{order.items?.length || 0} products</p>
            <p className="text-xs text-gray-400">{order.items?.reduce((sum, i) => sum + i.quantity, 0)} units</p>
          </div>
        </div>

        {/* Order Items - Clickable Cards */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Order Items ({order.items?.length || 0})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {order.items?.map((item, idx) => {
              const imgUrl = getItemImage(item);
              const fields = item.deliveryDetails?.fields || {};
              const filledFields = Object.entries(fields).filter(([, v]) => v && String(v).trim() !== "");
              const itemTotal = item.price * item.quantity;
              const isLarge = filledFields.length > 3;
              const productUrl = getProductUrl(item);
              const hasLink = !!productUrl;
              
              const variantValue = item.variant || item.variantLabel;
              const hasVariant = variantValue && variantValue !== 'null' && variantValue !== '';

              return (
                <div 
                  key={idx} 
                  className={`group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all ${
                    isLarge ? 'md:col-span-2 lg:col-span-1' : ''
                  } ${hasLink ? 'cursor-pointer hover:border-blue-300' : ''}`}
                  onClick={(e) => handleProductClick(item, e)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {imgUrl ? (
                        <img src={imgUrl} alt={item.name} className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900 text-sm truncate flex-1">
                          {item.name}
                        </p>
                        {hasLink && (
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {hasVariant && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                            {variantValue}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">×{item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-gray-900">{currency}{itemTotal.toFixed(2)}</span>
                        <span className="text-xs text-gray-400">{currency}{item.price?.toFixed(2)} each</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Details with Copy on Click */}
                  {(item.deliveryDetails?.contactEmail || item.deliveryDetails?.contactPhone) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-xs">
                      {item.deliveryDetails.contactEmail && (
                        <span 
                          className="flex items-center gap-1 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(item.deliveryDetails.contactEmail, "Email copied");
                          }}
                        >
                          <Mail className="w-3 h-3" /> {item.deliveryDetails.contactEmail}
                        </span>
                      )}
                      {item.deliveryDetails.contactPhone && (
                        <span 
                          className="flex items-center gap-1 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(item.deliveryDetails.contactPhone, "Phone copied");
                          }}
                        >
                          <Phone className="w-3 h-3" /> {item.deliveryDetails.contactPhone}
                        </span>
                      )}
                    </div>
                  )}

                  {filledFields.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className={`grid ${filledFields.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
                        {filledFields.map(([key, value]) => (
                          <div 
                            key={key} 
                            className="bg-gray-50 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors group/field"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(value, `${humanizeKey(key)} copied`);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-[9px] text-gray-400 uppercase tracking-wider">{humanizeKey(key)}</p>
                              <Copy className="w-2.5 h-2.5 text-gray-300 group-hover/field:text-blue-500 transition-colors" />
                            </div>
                            <p className="text-xs text-gray-700 font-medium truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bento Grid - Notes & Cancellation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {order.adminNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-medium text-amber-700 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Admin Notes
              </p>
              <p className="text-sm text-gray-700 mt-1">{order.adminNotes}</p>
            </div>
          )}

          {order.status === "Cancelled" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Cancelled Order
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-sm">
                <div>
                  <p className="text-xs text-red-600 font-medium">Reason</p>
                  <p className="text-red-700">{order.cancellationReason || "N/A"}</p>
                </div>
                {order.cancellationNote && (
                  <div>
                    <p className="text-xs text-red-600 font-medium">Note</p>
                    <p className="text-red-700">{order.cancellationNote}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-red-600 font-medium">Refund Status</p>
                  <p className="text-red-700">{order.refundStatus || "Pending"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {availableActions.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {availableActions.map((action, idx) => {
              const Icon = action.icon;
              if (action.action === "reject") {
                return (
                  <button
                    key={idx}
                    onClick={() => setShowRejectModal(true)}
                    disabled={updating}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </button>
                );
              }
              if (action.action === "refund") {
                return (
                  <button
                    key={idx}
                    onClick={() => setShowRefundModal(true)}
                    disabled={updating}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 transition-all disabled:opacity-50"
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </button>
                );
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleStatusUpdate(action.action)}
                  disabled={updating}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 transition-all disabled:opacity-50 ${
                    action.color === "blue" ? "bg-blue-500 hover:bg-blue-600" : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Payment Proof - Simple Dark Modal */}
        {showPaymentProof && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowPaymentProof(false)}
          >
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setShowPaymentProof(false)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <img
                src={order.paymentProof.screenshotUrl}
                alt="Payment Proof"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                onError={(e) => (e.target.src = "/placeholder-image.png")}
              />
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Reject Order
              </h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">Why is this order being rejected?</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Fake payment screenshot, incorrect amount, etc."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm mb-4 resize-none"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectOrder}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-sm font-medium disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Reject Order"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                Process Refund
              </h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">Confirm refund for this order?</p>
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600">
                <p className="font-medium">This will:</p>
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li>Mark the order as refunded</li>
                  <li>Update the refund status</li>
                  <li>Complete the order process</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefundConfirm}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all text-sm font-medium disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Refund"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;