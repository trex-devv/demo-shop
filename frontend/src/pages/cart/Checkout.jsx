// frontend/src/pages/Checkout.jsx
import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ShopContext } from "../../contexts/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Loader2, ArrowLeft, CheckCircle,
  Upload, X, CreditCard,
  ChevronRight, Clock, Package,
  Wallet, QrCode, Check
} from "lucide-react";

import esewaLogo from "../../assets/payments/esewa.png";
import khaltiLogo from "../../assets/payments/khalti.png";
import fonepayLogo from "../../assets/payments/fonepay.png";

const getPaymentDisplay = (method) => {
  const name = method.name?.toLowerCase() || "";
  if (name.includes("esewa")) return { type: "image", src: esewaLogo, label: "eSewa" };
  if (name.includes("khalti")) return { type: "image", src: khaltiLogo, label: "Khalti" };
  if (name.includes("fonepay")) return { type: "image", src: fonepayLogo, label: "FonePay" };
  if (name.includes("cash on delivery") || name.includes("cod")) return { type: "cod" };
  return { type: "text", label: method.name };
};

const getMethodKey = (method) => method.id ?? method._id ?? method.name;

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cartItems = [],
    currency,
    token,
    loading,
    backendUrl,
    clearUserCart,
    fetchCart,
  } = useContext(ShopContext);

  const isDirectBuy = location.state?.isDirectBuy || false;
  const directItem = location.state?.item || null;

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethodKey, setSelectedMethodKey] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [productImages, setProductImages] = useState({});
  const [subscriptionImages, setSubscriptionImages] = useState({});
  const [showProofLightbox, setShowProofLightbox] = useState(false);

  // Get checkout items - ensure we have valid items
  const checkoutItems = isDirectBuy && directItem 
    ? [directItem] 
    : (Array.isArray(cartItems) && cartItems.length > 0 ? cartItems : []);
  
  const selectedMethod = paymentMethods.find((m) => getMethodKey(m) === selectedMethodKey) || null;
  const isCOD = selectedMethod?.name?.toLowerCase()?.includes("cash on delivery") || false;

  const subtotal = checkoutItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const totalItems = checkoutItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Fetch product images for display
  useEffect(() => {
    const fetchImages = async () => {
      if (!checkoutItems || checkoutItems.length === 0) return;
      const productImageMap = {};
      const subscriptionImageMap = {};
      
      for (const item of checkoutItems) {
        if (!item.isSubscription && item.productId) {
          try {
            const res = await axios.get(`${backendUrl}/api/product/${item.productId}`);
            if (res.data.success && res.data.product?.images?.[0]?.secure_url) {
              productImageMap[item.productId] = res.data.product.images[0].secure_url;
            }
          } catch (e) {
            // Silent fail - use placeholder
          }
        }
        if (item.isSubscription && item.subscriptionId) {
          try {
            const res = await axios.get(`${backendUrl}/api/subscription/${item.subscriptionId}`);
            if (res.data.success && res.data.subscription?.images?.[0]?.secure_url) {
              subscriptionImageMap[item.subscriptionId] = res.data.subscription.images[0].secure_url;
            }
          } catch (e) {
            // Silent fail - use placeholder
          }
        }
      }
      setProductImages(productImageMap);
      setSubscriptionImages(subscriptionImageMap);
    };
    fetchImages();
  }, [checkoutItems, backendUrl]);

  useEffect(() => {
    if (orderPlaced && orderData) {
      const timer = setTimeout(() => {
        navigate(-1); 
      }, 3000);

      return () => clearTimeout(timer); 
    }
  }, [orderPlaced, orderData, navigate]);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoadingMethods(true);
      const res = await axios.get(`${backendUrl}/api/payment/active`);
      const methods = res.data.methods || res.data.data || [];
      if (res.data.success && Array.isArray(methods)) {
        setPaymentMethods(methods);
        if (methods.length) setSelectedMethodKey(getMethodKey(methods[0]));
      }
    } catch (error) {
      toast.error("Failed to load payment methods");
      setPaymentMethods([]);
    } finally {
      setLoadingMethods(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // Redirect if no items
  useEffect(() => {
    if (loading) return;
    if (!checkoutItems?.length) {
      // If direct buy with no item, go to collection
      // If cart checkout with no items, go to cart
      navigate(isDirectBuy ? "/collection" : "/cart");
    }
  }, [loading, checkoutItems, navigate, isDirectBuy]);

  const getProductImage = (item) => {
    if (item.isSubscription) return subscriptionImages[item.subscriptionId] || '/subscription-placeholder.jpg';
    return productImages[item.productId] || '/placeholder.jpg';
  };

  const handlePaymentProofChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image size should be less than 5MB");
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProof(reader.result);
      setPaymentProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePlaceOrder = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }
    
    if (!isCOD && !paymentProof) {
      toast.error("Please upload payment screenshot");
      return;
    }

    setSubmitting(true);
    
    try {
      // Prepare order items
      const orderItems = checkoutItems.map((item) => ({
        productId: item.productId || null,
        subscriptionId: item.subscriptionId || null,
        name: item.name,
        variant: item.variant || null,
        quantity: item.quantity,
        price: item.price,
        categoryId: item.categoryId || null,
        categorySlug: item.categorySlug || "",
        isSubscription: item.isSubscription || false,
        variantLabel: item.variantLabel || null,
        duration: item.duration || null,
        deliveryDetails: item.deliveryDetails || {},
      }));

      // Send order to backend
      const res = await axios.post(
        `${backendUrl}/api/order/place`,
        { 
          items: orderItems, 
          amount: subtotal, 
          paymentMethod: selectedMethod.name, 
          paymentProof: paymentProof || "", 
          paymentMethodDetails: selectedMethod, 
          isDirectBuy,
          // Add source to help backend differentiate
          source: isDirectBuy ? 'direct_buy' : 'cart_checkout'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setOrderData(res.data.order);
        setOrderPlaced(true);
        toast.success("Order placed successfully!");
        
        if (!isDirectBuy) {
          await clearUserCart();
          await fetchCart(); // Refresh cart to reflect empty state
        }
      } else {
        toast.error(res.data.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const renderPaymentMethod = (method) => {
    const display = getPaymentDisplay(method);
    const methodKey = getMethodKey(method);
    const isSelected = selectedMethodKey === methodKey;
    const isCod = display.type === "cod";

    return (
      <button
        key={methodKey}
        onClick={() => setSelectedMethodKey(methodKey)}
        className={`group relative flex items-center justify-between px-2 py-1.5 border-2 rounded-xl transition-all duration-200 w-full text-left ${
          isSelected
            ? "border-gray-500 bg-gray-50/90 shadow-sm ring-2 ring-gray-500/10"
            : "border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/50"
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs`}>
            {display.type === "image" ? (
              <img src={display.src} alt={display.label} className="h-6 w-auto object-contain" />
            ) : isCod ? (
              <Wallet className="w-5 h-5 text-emerald-600" />
            ) : (
              <CreditCard className="w-5 h-5 text-gray-700" />
            )}
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-medium text-gray-900 truncate tracking-tight">
              {display.label}
            </span>
            {isCod && (
              <span className="block text-sm font-medium text-gray-900 mt-0.5">
                COD
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  const getSelectedPaymentLogo = () => {
    if (!selectedMethod) return null;
    const display = getPaymentDisplay(selectedMethod);
    if (display.type === "image") return display.src;
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Order placed success state
  if (orderPlaced && orderData) {
    return (
      <div className="max-w-lg min-h-[80vh] mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl mt-20">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Order Placed Successfully!</h2>
          <p className="text-gray-500 mt-2 text-base">#{orderData.orderNumber}</p>
          <div className="flex items-center justify-center gap-2 text-base text-gray-400 mt-4 bg-gray-50 py-2 px-4 rounded-full max-w-xs mx-auto">
            <span>Your order will be delivered within 24 hrs</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link to="/orders" className="flex-1 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium">
              View Orders
            </Link>
            <Link to="/collection" className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No items state
  if (!checkoutItems?.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No items to checkout</p>
        <Link to="/collection" className="text-blue-600 hover:text-blue-700 mt-2 inline-block text-sm font-medium">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(isDirectBuy ? -1 : "/cart")} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isDirectBuy ? "Complete Purchase" : "Checkout"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
              <span className="text-sm font-semibold text-gray-700">
                {isDirectBuy ? "Item" : "Order Items"}
              </span>
            </div>
            {checkoutItems.map((item, idx) => {
              const img = getProductImage(item);
              return (
                <div key={item._id || idx} className="px-5 py-3.5 border-b border-gray-100 last:border-0 flex items-center gap-4 hover:bg-gray-50/30 transition">
                  <img 
                    src={img} 
                    alt={item.name} 
                    className="w-12 h-12 object-cover rounded-lg border border-gray-200" 
                    onError={(e) => e.target.src = '/placeholder.jpg'} 
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                      <span>{item.name}</span>
                      {(item.variantLabel || item.variant) && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.isSubscription && item.variantLabel 
                            ? "text-blue-600 bg-blue-50" 
                            : "text-gray-500 bg-gray-100"
                        }`}>
                          {item.isSubscription && item.variantLabel ? item.variantLabel : item.variant}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{currency}{item.price.toFixed(2)} × {item.quantity}</div>
                  </div>
                  <div className="font-semibold text-gray-900">{currency}{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
              <span className="text-sm font-semibold text-gray-700">Order Summary</span>
            </div>
            <div className="px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{currency}{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Payment */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Payment Methods */}
            <div className="px-5 py-5 border-b border-gray-100/80 bg-gradient-to-b from-white to-gray-50/30">
              <div className="flex items-center justify-between mb-3.5">
                <div className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  Choose Payment Method
                </div>
              </div>

              {loadingMethods ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs text-gray-400 font-medium animate-pulse">Loading payment methods</span>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">No payment methods found</p>
                  <p className="text-xs text-gray-400 mt-0.5">Please try again later or contact support.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {paymentMethods.map(renderPaymentMethod)}
                </div>
              )}
            </div>

            {/* QR Code & Upload */}
            {!isCOD && selectedMethod?.qrCode && (
              <div className="px-5 py-5 border-b border-gray-200">
                <div className="flex flex-wrap gap-6 items-start justify-center">
                  {/* QR Code with Logo Overlay */}
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-600 mb-2.5 flex items-center justify-center gap-1.5">
                      Scan QR Code to Pay
                    </div>
                    <img src={selectedMethod.qrCode} alt="QR" className="w-44 h-44 object-contain" />
                    <div className="flex justify-center gap-2 items-center text-medium text-gray-800 mt-1.5 font-medium">
                      {getSelectedPaymentLogo() != null ? <img 
                        src={getSelectedPaymentLogo()} 
                        alt={selectedMethod.name} 
                        className="w-4 h-4 object-contain"
                      />: null}
                      {selectedMethod.name}
                    </div>
                  </div>

                  {/* Upload Screenshot */}
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-600 mb-2.5 flex items-center justify-center gap-1.5">
                      Payment Screenshot
                    </div>
                    {paymentProofPreview ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowProofLightbox(true)}
                          className="relative block w-[130px] h-[250px] mx-auto rounded-xl border border-gray-200 bg-gray-50 overflow-hidden shadow-sm group"
                        >
                          <img
                            src={paymentProofPreview}
                            alt="Payment proof"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-medium transition-opacity px-2 text-center">
                              Tap to view full size
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPaymentProof(null); setPaymentProofPreview(null); }}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="w-[130px] h-[250px] mx-auto border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-500 transition flex flex-col items-center justify-center bg-gray-50/80 hover:bg-gray-100">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-500 mt-2 font-medium">Upload</span>
                        <span className="text-[10px] text-gray-400 mt-1 text-center px-2">PNG, JPG<br/>up to 5MB</span>
                        <input type="file" accept="image/*" onChange={handlePaymentProofChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment screenshot lightbox */}
            {showProofLightbox && paymentProofPreview && (
              <div
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
                onClick={() => setShowProofLightbox(false)}
              >
                <img
                  src={paymentProofPreview}
                  alt="Payment proof full size"
                  className="relative max-h-[80%] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* COD Info */}
            {isCOD && (
              <div className="px-5 py-3.5 border-b border-gray-200">
                <div className="flex items-center gap-3 p-3.5 bg-green-50 rounded-xl border border-green-200">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wallet className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-green-900">Cash on Delivery</div>
                    <div className="text-xs text-green-700">Pay when delivered. No screenshot needed.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Place Order Button */}
            <div className="px-5 py-4 bg-gray-50/80">
              <button
                onClick={handlePlaceOrder}
                disabled={submitting || !selectedMethod || (!isCOD && !paymentProof)}
                className={`w-full py-3.5 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2 ${
                  submitting || !selectedMethod || (!isCOD && !paymentProof)
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-gray-800 active:scale-[0.98] shadow-sm"
                }`}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</>
                ) : (
                  <>{isDirectBuy ? "Complete Purchase" : "Place Order"} <ChevronRight size={18} /></>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2.5">By placing order, you agree to our Terms & Conditions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;