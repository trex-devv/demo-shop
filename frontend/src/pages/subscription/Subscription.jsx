import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ShopContext } from "../../contexts/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  Loader2, Award, ChevronLeft, Star, 
  AlertCircle, ShoppingCart, Check, 
  Minus, Plus, Calendar, ExternalLink
} from "lucide-react";
import FormattedDescription from "../../components/FormattedDescription";
import DeliveryDetailsModal from "../../components/DeliveryDetailsModal";

const Subscription = () => {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const { backendUrl, currency, addSubscriptionToCart, token, user } = useContext(ShopContext);
  
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [relatedSubscriptions, setRelatedSubscriptions] = useState([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [isBuyNow, setIsBuyNow] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [slug, id]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      let response;
      let identifier = slug || id;
      
      if (!identifier) {
        toast.error("Invalid subscription link");
        navigate("/subscriptions");
        return;
      }
      
      // Try to fetch by slug first
      try {
        response = await axios.get(backendUrl + `/api/subscription/slug/${identifier}`);
      } catch (slugError) {
        try {
          response = await axios.get(backendUrl + `/api/subscription/${identifier}`);
        } catch (idError) {
          throw new Error("Subscription not found");
        }
      }
      
      if (response.data.success) {
        const sub = response.data.subscription;
        setSubscription(sub);
        if (sub.variants && sub.variants.length > 0) {
          setSelectedVariant(sub.variants[0]);
        }
        fetchRelatedSubscriptions(sub._id);
      } else {
        toast.error("Subscription not found");
        navigate("/subscriptions");
      }
    } catch (error) {
      toast.error("Failed to load subscription");
      navigate("/subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedSubscriptions = async (excludeId) => {
    try {
      const response = await axios.get(backendUrl + `/api/subscription?isActive=true`);
      if (response.data.success) {
        const filtered = response.data.subscriptions
          .filter(s => s._id !== excludeId && s.isActive === true)
          .slice(0, 4);
        setRelatedSubscriptions(filtered);
      }
    } catch (error) {
    }
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

  const handleAddToCart = () => {
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      toast.error("Please select a plan");
      return;
    }

    setIsBuyNow(false);
    setShowDeliveryModal(true);
  };

  const handleBuyNow = () => {
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      toast.error("Please select a plan");
      return;
    }

    setIsBuyNow(true);
    setShowDeliveryModal(true);
  };

  const handleDeliveryConfirm = async (deliveryDetails) => {
    setAdding(true);
    
    try {
      if (isBuyNow) {
        // Buy Now: Prepare item for direct checkout
        const item = {
          subscriptionId: subscription._id,
          name: subscription.name,
          variant: selectedVariant.label,
          quantity: quantity,
          price: selectedVariant.price,
          variantLabel: selectedVariant.label,
          duration: selectedVariant.duration,
          isSubscription: true,
          categorySlug: 'subscription',
          deliveryDetails: deliveryDetails
        };

        // Navigate directly to checkout
        navigate("/checkout", { 
          state: { 
            isDirectBuy: true,
            item: item
          } 
        });
      } else {
        // Add to Cart: Use existing addSubscriptionToCart function
        const result = await addSubscriptionToCart(
          subscription._id,
          selectedVariant.label,
          quantity,
          deliveryDetails,
          subscription.name,
          selectedVariant.price,
          selectedVariant.label,
          selectedVariant.duration,
          subscription.slug
        );
        
        if (result.success) {
          toast.success(`Added to cart!`);
          setShowDeliveryModal(false);
        }
      }
    } catch (error) {
      toast.error("Failed to process request");
    } finally {
      setAdding(false);
      setShowDeliveryModal(false);
    }
  };

  const increaseQuantity = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1);
    } else {
      toast.info("Maximum quantity is 10");
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="pt-4 sm:pt-6 pb-12 sm:pb-16 px-3 sm:px-4 md:px-6 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">
        <div className="lg:w-1/2">
          <div className="aspect-square bg-gray-200 rounded-xl sm:rounded-2xl animate-pulse" />
        </div>
        <div className="lg:w-1/2 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-12 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-12 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-16 bg-gray-200 rounded w-full animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!subscription) {
    return (
      <div className="text-center py-12 sm:py-16 px-4">
        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Subscription not found</p>
        <Link to="/subscriptions" className="text-sm text-gray-600 hover:text-gray-900 underline mt-2 inline-block">
          Browse subscriptions
        </Link>
      </div>
    );
  }

  const isOutOfStock = !subscription.isActive;
  const imageUrl = subscription.images?.[0]?.secure_url;
  const isLoggedIn = !!token;

  return (
    <>
      <div className="pt-4 sm:pt-6 pb-12 sm:pb-16 px-3 sm:px-4 md:px-6 max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-4 sm:mb-6 transition text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back
        </button>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">
          {/* Left - Image */}
          <div className="lg:w-1/2">
            <div className="relative aspect-square bg-gray-50 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={subscription.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Award className="w-16 h-16" />
                </div>
              )}
              {subscription.isPopular && !isOutOfStock && (
                <span className="absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full bg-yellow-400 text-black font-medium shadow-sm">
                  Popular
                </span>
              )}
              <span className="absolute top-3 right-3 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-gray-100 text-gray-600">
                {subscription.category}
              </span>
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold text-sm px-5 py-2.5 bg-red-600 rounded-xl shadow-lg">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right - Details */}
          <div className="lg:w-1/2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 break-words">
              {subscription.name}
            </h1>
            
            {subscription.provider && (
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                <a href={subscription.providerWebsite} className="text-blue-600 hover:underline">{subscription.provider}</a>
              </p>
            )}

            {/* Price */}
            <div className="mt-4">
              <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                Rs. {selectedVariant?.price || 0}
              </span>
              {subscription.variants && subscription.variants.length > 1 && (
                <span className="text-sm text-gray-400 ml-2">
                  / {selectedVariant?.label}
                </span>
              )}
            </div>

            {/* Variants / Plans - Only show if more than 1 variant */}
            {subscription.variants && subscription.variants.length > 1 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Select Plan</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {subscription.variants.map((variant) => (
                    <button
                      key={variant.label}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={isOutOfStock}
                      className={`px-4 py-3 border rounded-lg text-sm transition ${
                        selectedVariant?.label === variant.label
                          ? "border-gray-900 bg-gray-50 text-gray-900"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-medium">{variant.label}</div>
                      <div className="text-gray-600">Rs. {variant.price}</div>
                      <div className="text-xs text-gray-400">{getDurationLabel(variant.duration)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1 || isOutOfStock || adding}
                  className="w-10 h-10 sm:w-10 sm:h-10 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
                <span className="w-12 sm:w-12 text-center font-medium text-base sm:text-base">{quantity}</span>
                <button
                  onClick={increaseQuantity}
                  disabled={quantity >= 10 || isOutOfStock || adding}
                  className="w-10 h-10 sm:w-10 sm:h-10 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
                <span className="text-xs text-gray-400">(Max 10)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6">
              {subscription.description && (
                <p className="text-xs text-gray-500 mb-2">
                  * Please read the description below before proceeding
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || !isLoggedIn || adding}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 sm:px-6 py-3.5 sm:py-3.5 font-medium rounded-xl transition text-base sm:text-base ${
                    isOutOfStock || !isLoggedIn || adding
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-5 sm:h-5 animate-spin" />
                      Adding...
                    </>
                  ) : isOutOfStock ? (
                    <>
                      <AlertCircle className="w-5 h-5 sm:w-5 sm:h-5" />
                      Out of Stock
                    </>
                  ) : !isLoggedIn ? (
                    <>
                      <ShoppingCart className="w-5 h-5 sm:w-5 sm:h-5" />
                      Login to Purchase
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 sm:w-5 sm:h-5" />
                      Add to Cart
                    </>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || !isLoggedIn || adding}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 sm:px-6 py-3.5 sm:py-3.5 font-medium rounded-xl transition text-base sm:text-base ${
                    isOutOfStock || !isLoggedIn || adding
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-5 sm:h-5 animate-spin" />
                      Processing...
                    </>
                  ) : isOutOfStock ? (
                    'Unavailable'
                  ) : !isLoggedIn ? (
                    'Login to Buy'
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>

              {!isLoggedIn && (
                <p className="text-xs text-center text-gray-400 mt-2">
                  Please <Link to="/login" className="text-gray-600 hover:underline">login</Link> to purchase
                </p>
              )}
            </div>

            {/* Features */}
            {subscription.features && subscription.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {subscription.features.map((feature, index) => (
                  <span 
                    key={index} 
                    className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full border border-emerald-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description Section - Bottom */}
        {subscription.description && (
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <FormattedDescription text={subscription.description} />
          </div>
        )}

        {/* You May Also Like Section */}
        {relatedSubscriptions.length > 0 && (
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {relatedSubscriptions.map((sub) => {
                const minPrice = sub.variants && sub.variants.length > 0 
                  ? Math.min(...sub.variants.map(v => v.price))
                  : 0;
                
                const hasVariants = sub.variants && sub.variants.length > 0;
                
                return (
                  <Link
                    key={sub._id}
                    to={`/subscription/${sub.slug}`}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-300 transition"
                  >
                    <div className="aspect-square bg-gray-50 overflow-hidden relative">
                      {sub.images?.[0]?.secure_url ? (
                        <img 
                          src={sub.images[0].secure_url} 
                          alt={sub.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Award className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      {sub.isPopular && (
                        <span className="absolute top-2 left-2 text-[8px] px-1.5 py-0.5 rounded-full bg-yellow-400 text-black font-medium">
                          Popular
                        </span>
                      )}
                      {hasVariants && (
                        <span className="absolute bottom-2 right-2 text-[8px] px-1.5 py-0.5 rounded-full bg-white/90 text-gray-700 font-medium shadow-sm backdrop-blur-sm">
                          {sub.variants.length} plans
                        </span>
                      )}
                    </div>
                    <div className="p-2 sm:p-3">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{sub.name}</h4>
                      <p className="text-sm font-bold text-gray-900 mt-1">Rs. {minPrice}</p>
                      {hasVariants && (
                        <p className="text-[10px] text-gray-400">Starting from</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delivery Details Modal - Subscription */}
      <DeliveryDetailsModal
        isOpen={showDeliveryModal}
        onClose={() => {
          setShowDeliveryModal(false);
          setAdding(false);
        }}
        onConfirm={handleDeliveryConfirm}
        product={{
          name: subscription?.name,
          categoryId: null
        }}
        isSubscription={true}
        backendUrl={backendUrl}
        loading={adding}
        user={user}
        isBuyNow={isBuyNow}
      />
    </>
  );
};

export default Subscription;