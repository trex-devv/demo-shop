import React, { useContext, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShopContext } from "../../contexts/ShopContext.jsx";
import { toast } from "react-toastify";
import { 
  Minus, Plus, Trash2, ShoppingBag, ArrowRight, X, Award, 
  Eye, Edit2, Save, ChevronRight, User, Mail, Phone, 
  AlertCircle, CheckCircle, FileText
} from "lucide-react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import DeliveryDetailsModal from "../../components/DeliveryDetailsModal.jsx";

// Loading Skeleton Component
const CartSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-48 mb-8"></div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="col-span-6 h-4 bg-gray-200 rounded"></div>
              <div className="col-span-2 h-4 bg-gray-200 rounded"></div>
              <div className="col-span-2 h-4 bg-gray-200 rounded"></div>
              <div className="col-span-1 h-4 bg-gray-200 rounded"></div>
              <div className="col-span-1 h-4 bg-gray-200 rounded"></div>
            </div>
            
            {[...Array(2)].map((_, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 md:px-6 py-4 border-b border-gray-100">
                <div className="col-span-1 md:col-span-6 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 flex items-center justify-start md:justify-center">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="col-span-1 md:col-span-2 flex items-center justify-start md:justify-center">
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="col-span-1 md:col-span-1 flex items-center justify-start md:justify-center">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="col-span-1 md:col-span-1 flex items-center justify-start md:justify-center">
                  <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
            <div className="h-12 bg-gray-200 rounded-lg w-full mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty Cart Component
const EmptyCart = () => {
  const navigate = useNavigate();
  const { products, currency } = useContext(ShopContext);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  useEffect(() => {
    if (products && products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setSuggestedProducts(shuffled.slice(0, 4));
    }
  }, [products]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-12">
        <div className="bg-white p-8 sm:p-12 max-w-2xl mx-auto">
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <ShoppingBag className="w-14 h-14 text-gray-400" strokeWidth={1.5} />
            </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Your cart is empty
          </h2>
          <p className="text-gray-500 text-base sm:text-lg mb-8 max-w-sm mx-auto">
            Looks like you haven't added anything to your cart yet.
            <span className="block text-sm text-gray-400 mt-1">Start exploring our amazing products!</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/collection")}
              className="group px-8 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 inline-flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Browse Categories</span>
            </button>
            <button
              onClick={() => navigate("/subscriptions")}
              className="px-8 py-3.5 bg-transparent border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              View Subscriptions
            </button>
          </div>
        </div>
      </div>

      {suggestedProducts.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">You May Like</h3>
            <button
              onClick={() => navigate("/collection")}
              className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1"
            >
              View All
              <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {suggestedProducts.map((product) => {
              const hasVariants = product.pricingType === "variants" && product.variants?.length > 0;
              let displayPrice = `${currency}${product.price}`;
              if (hasVariants) {
                const prices = product.variants.map(v => v.price);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                displayPrice = min === max ? `${currency}${min}` : `${currency}${min} - ${currency}${max}`;
              }

              return (
                <div
                  key={product._id}
                  onClick={() => navigate(`/product/${product._id}`)}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
                    {product.images?.[0]?.secure_url ? (
                      <img 
                        src={product.images[0].secure_url} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-xs px-3 py-1.5 bg-red-600 rounded-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{product.name}</h4>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {displayPrice}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// View Delivery Details Modal Component (No Edit)
const ViewDeliveryDetailsModal = ({ isOpen, onClose, item }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (item && isOpen) {
      const fields = item.deliveryDetails?.fields || {};
      setFormData(fields);
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const fieldLabels = {
    username: 'Username',
    email: 'Email',
    phone: 'Phone',
    id: 'ID',
    uid: 'UID',
    characterName: 'Character Name',
    nickname: 'Nickname',
    server: 'Server',
    playerId: 'Player ID',
    playerName: 'Player Name',
    serverId: 'Server ID',
    contactEmail: 'Contact Email',
    contactPhone: 'Contact Phone'
  };

  const entries = Object.entries(formData).filter(([key, value]) => value && value.trim() !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              Delivery Details
            </h3>
            <p className="text-sm text-gray-500">{item?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No delivery details available</p>
            </div>
          ) : (
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              {entries.map(([key, value]) => {
                const label = fieldLabels[key] || key.charAt(0).toUpperCase() + key.slice(1);
                return (
                  <div key={key} className="flex items-start gap-3 py-2 border-b border-gray-200 last:border-0">
                    <span className="text-sm text-gray-500 min-w-[100px] font-medium">{label}:</span>
                    <span className="text-sm text-gray-900 break-all">{value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// You May Like Component
const YouMayLike = () => {
  const navigate = useNavigate();
  const { products, currency } = useContext(ShopContext);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  useEffect(() => {
    if (products && products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setSuggestedProducts(shuffled.slice(0, 4));
    }
  }, [products]);

  if (suggestedProducts.length === 0) return null;

  return (
    <div className="mt-8 sm:mt-10 md:mt-12">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">You May Also Like</h3>
        <button
          onClick={() => navigate("/collection")}
          className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1"
        >
          View All
          <ArrowRight size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {suggestedProducts.map((product) => {
          const hasVariants = product.pricingType === "variants" && product.variants?.length > 0;
          let displayPrice = `${currency}${product.price}`;
          if (hasVariants) {
            const prices = product.variants.map(v => v.price);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            displayPrice = min === max ? `${currency}${min}` : `${currency}${min} - ${currency}${max}`;
          }

          return (
            <div
              key={product._id}
              onClick={() => navigate(`/product/${product._id}`)}
              className="group bg-white border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="aspect-square bg-gray-50 overflow-hidden relative">
                {product.images?.[0]?.secure_url ? (
                  <img 
                    src={product.images[0].secure_url} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                  </div>
                )}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 rounded-lg">
                      Out of Stock
                    </span>
                  </div>
                )}
                {hasVariants && product.inStock && (
                  <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full bg-white/90 text-gray-700 font-medium shadow-sm">
                    {product.variants.length} plans
                  </span>
                )}
              </div>
              <div className="p-2 sm:p-3 md:p-4">
                <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{product.name}</h4>
                <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 sm:mt-1">
                  {displayPrice}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Cart = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    cartItems, 
    cartCount, 
    subtotal, 
    updateCartItemQuantity, 
    removeFromCartItem, 
    clearUserCart,
    currency,
    token,
    loading,
    backendUrl 
  } = useContext(ShopContext);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [productImages, setProductImages] = useState({});
  const [subscriptionImages, setSubscriptionImages] = useState({});

  // Fetch product images for cart items
  useEffect(() => {
  const fetchImages = async () => {
    if (!cartItems || cartItems.length === 0) return;
    
    const productImageMap = {};
    const subscriptionImageMap = {};
    
    for (const item of cartItems) {
      // Fetch product images (only for non-subscription items)
      if (!item.isSubscription && item.productId) {
        try {
          const response = await axios.get(`${backendUrl}/api/product/${item.productId}`);
          if (response.data.success && response.data.product) {
            const product = response.data.product;
            if (product.images && product.images.length > 0 && product.images[0].secure_url) {
              productImageMap[item.productId] = product.images[0].secure_url;
            } else {
              productImageMap[item.productId] = null;
            }
          }
        } catch (error) {
          productImageMap[item.productId] = null;
        }
      }
      
      // Fetch subscription images (only for subscription items)
      if (item.isSubscription && item.subscriptionId) {
        try {
          const response = await axios.get(`${backendUrl}/api/subscription/${item.subscriptionId}`);
          if (response.data.success && response.data.subscription) {
            const subscription = response.data.subscription;
            if (subscription.images && subscription.images.length > 0 && subscription.images[0].secure_url) {
              subscriptionImageMap[item.subscriptionId] = subscription.images[0].secure_url;
            } else {
              subscriptionImageMap[item.subscriptionId] = null;
            }
          }
        } catch (error) {
          subscriptionImageMap[item.subscriptionId] = null;
        }
      }
    }
    
    setProductImages(productImageMap);
    setSubscriptionImages(subscriptionImageMap);
  };

  fetchImages();
}, [cartItems, backendUrl]);

  const actualSubtotal = cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const actualTotalItems = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > 10) {
      toast.info("Maximum quantity is 10");
      return;
    }
    
    setIsUpdating(true);
    await updateCartItemQuantity(itemId, newQuantity);
    setIsUpdating(false);
  };

  const handleRemoveItem = (itemId) => {
    const item = cartItems.find(i => i._id === itemId);
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = async () => {
    if (itemToDelete) {
      await removeFromCartItem(itemToDelete._id);
      setItemToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) {
      toast.info("Your cart is already empty");
      return;
    }
    setShowClearModal(true);
  };

  const confirmClearCart = async () => {
    await clearUserCart();
    setShowClearModal(false);
  };

  const handleCheckout = () => {
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const getProductImage = (item) => {
    if (item.isSubscription) {
      return subscriptionImages[item.subscriptionId] || '/placeholder.jpg';
    }
    return productImages[item.productId] || '/placeholder.jpg';
  };

  const getProductLink = (item) => {
    if (item.isSubscription) {
      return `/subscription/id/${item.subscriptionId}`;
    }
    return `/product/${item.productId}`;
  };

  const renderDeliveryStatus = (item) => {
    const fields = item.deliveryDetails?.fields || {};
    const entries = Object.entries(fields).filter(([key, value]) => value && value.trim() !== '');
    
    if (entries.length === 0) {
      return (
        <button
          onClick={() => handleViewDetails(item)}
          className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <AlertCircle size={12} />
          Add Details
        </button>
      );
    }

    return (
      <button
        onClick={() => handleViewDetails(item)}
        className="px-2.5 sm:px-3 py-1.5 text-xs text-white bg-blue-500 hover:bg-blue-600 font-medium rounded-md shadow-sm transition-colors flex items-center gap-1 group"
      >
        <span>View Details</span>
      </button>
    );
  };

  // Show skeleton while loading
  if (loading) {
    return <CartSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Your Cart</h1>
        <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2.5 sm:px-3 py-1 rounded-full">
          {actualTotalItems} {actualTotalItems === 1 ? 'item' : 'items'}
        </span>
      </div>
      
      {cartItems && cartItems.length > 0 ? (
        <>
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Cart Items Section */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Desktop Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                  <div className="col-span-4">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-center">Details</div>
                  <div className="col-span-1 text-center">Total</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {/* Cart Items */}
                {cartItems.map((item) => {
                  const imageUrl = getProductImage(item);
                  const itemTotal = item.price * item.quantity;
                  
                  return (
                    <div key={item._id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-3 sm:px-4 md:px-6 py-4 sm:py-4 border-b border-gray-100 hover:bg-gray-50/50 transition">
                      {/* Product Info - Full width on mobile */}
                      <div className="col-span-1 md:col-span-4 flex items-start md:items-center gap-3 sm:gap-4">
                        <Link to={getProductLink(item)} className="flex-shrink-0">
                          <img 
                            src={imageUrl} 
                            alt={item.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 md:w-20 md:h-20 object-cover rounded-lg bg-gray-100 border border-gray-200"
                            onError={(e) => {
                              e.target.src = '/placeholder.jpg';
                            }}
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link to={getProductLink(item)} className="hover:underline">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</h3>
                          </Link>
                          {item.variant && (
                            <p className="text-xs sm:text-sm text-gray-500">{item.variant}</p>
                          )}
                          
                          {/* Mobile: Details Status */}
                          <div className="mt-1 md:hidden">
                            {renderDeliveryStatus(item)}
                          </div>

                          {/* Mobile price and quantity */}
                          <div className="flex items-center gap-2 mt-2 md:hidden">
                            {/* Quantity controls on mobile */}
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                                className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="px-2 py-1 min-w-[24px] text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                                disabled={isUpdating || item.quantity >= 10}
                                className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 ml-auto">
                              {currency}{itemTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price - Hidden on mobile */}
                      <div className="hidden md:col-span-2 md:flex items-center justify-center">
                        <span className="font-medium text-gray-900">{currency}{item.price.toFixed(2)}</span>
                      </div>

                      {/* Quantity - Hidden on mobile */}
                      <div className="hidden md:col-span-2 md:flex items-center justify-center">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="px-2.5 sm:px-3 py-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-2.5 sm:px-3 py-1.5 min-w-[30px] text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                            disabled={isUpdating || item.quantity >= 10}
                            className="px-2.5 sm:px-3 py-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Delivery Details - Desktop */}
                      <div className="hidden md:col-span-2 md:flex md:items-center md:justify-center">
                        {renderDeliveryStatus(item)}
                      </div>

                      {/* Total - Desktop */}
                      <div className="hidden md:col-span-1 md:flex items-center justify-center">
                        <span className="font-semibold text-gray-900">
                          {currency}{itemTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="col-span-1 md:col-span-1 flex items-center justify-end md:justify-center">
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          className="text-red-500 hover:text-red-700 transition p-1.5 sm:p-2 hover:bg-red-50 rounded-lg"
                          disabled={isUpdating}
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Cart Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
                  <span></span>
                  <button
                    onClick={handleClearCart}
                    className="text-sm text-red-500 hover:text-red-700 transition font-medium flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 sticky top-24">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm sm:text-base text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">{currency}{actualSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base text-gray-600">
                    <span>Items</span>
                    <span className="font-medium text-gray-900">{actualTotalItems} items</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>{currency}{actualSubtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full mt-4 sm:mt-6 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* You May Like - Always visible when cart has items */}
          <YouMayLike />
        </>
      ) : (
        <EmptyCart />
      )}

      {/* View Delivery Details Modal */}
      <ViewDeliveryDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
      />

      {/* Delete Item Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto p-6 animate-fadeIn">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                  <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Remove Item</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm sm:text-base text-gray-600 mb-2">
              Are you sure you want to remove <span className="font-semibold text-gray-900">"{itemToDelete.name}"</span> from your cart?
            </p>
            {itemToDelete.variant && (
              <p className="text-xs sm:text-sm text-gray-500 mb-4">
                Variant: {itemToDelete.variant}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                className="w-full sm:flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm sm:text-base order-1 sm:order-2"
              >
                Remove Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto p-6 animate-fadeIn">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                  <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Clear Cart</h3>
              </div>
              <button
                onClick={() => setShowClearModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm sm:text-base text-gray-600">
              Are you sure you want to remove <span className="font-semibold text-gray-900">all {actualTotalItems} items</span> from your cart?
            </p>
            <p className="text-xs sm:text-sm text-red-500 mt-1">This action cannot be undone.</p>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
              <button
                onClick={() => setShowClearModal(false)}
                className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearCart}
                className="w-full sm:flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm sm:text-base order-1 sm:order-2"
              >
                Clear All Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;