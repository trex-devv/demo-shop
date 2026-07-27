import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ShopContext } from "../../contexts/ShopContext.jsx";
import { toast } from "react-toastify";
import { 
  Loader2, ShoppingCart, Package, 
  ChevronLeft, Minus, Plus, AlertCircle
} from "lucide-react";
import FormattedDescription from "../../components/FormattedDescription.jsx";
import DeliveryDetailsModal from "../../components/DeliveryDetailsModal.jsx";

const Product = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, currency, addToCart, token, loading: shopLoading, backendUrl, user } = useContext(ShopContext);
  const [product, setProduct] = useState(null);
  const [image, setImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [isBuyNow, setIsBuyNow] = useState(false);

  useEffect(() => {
    if (products.length > 0) {
      const found = products.find((item) => item._id === productId);
      if (found) {
        setProduct(found);
        const images = found.images?.map(img => img.secure_url) || found.image || [];
        setImage(images[0] || "");
        if (found.pricingType === "variants" && found.variants?.length > 0) {
          setSelectedVariant(found.variants[0]);
        }
        
        const related = products.filter(p => 
          p._id !== found._id && (
            p.category?._id === found.category?._id || 
            p.subCategory?._id === found.subCategory?._id
          )
        ).slice(0, 4);
        setRelatedProducts(related);
      } else {
        navigate("/collection");
      }
      setIsLoading(false);
    } else if (!shopLoading) {
      setIsLoading(false);
      navigate("/collection");
    }
  }, [productId, products, shopLoading, navigate]);

  const getPrice = () => {
    if (!product) return 0;
    if (product.pricingType === "flat") return product.price || 0;
    if (product.pricingType === "variants" && selectedVariant) {
      return selectedVariant.price || 0;
    }
    return product.price || 0;
  };

  const isOutOfStock = () => {
    return !product?.inStock;
  };

  const handleAddToCart = () => {
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    if (!product) return;
    if (isOutOfStock()) {
      toast.error("This product is out of stock");
      return;
    }
    if (product.pricingType === "variants" && !selectedVariant) {
      toast.error("Please select a variant");
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
    if (!product) return;
    if (isOutOfStock()) {
      toast.error("This product is out of stock");
      return;
    }
    if (product.pricingType === "variants" && !selectedVariant) {
      toast.error("Please select a variant");
      return;
    }

    setIsBuyNow(true);
    setShowDeliveryModal(true);
  };

  const handleDeliveryConfirm = async (deliveryDetails) => {
    setIsAddingToCart(true);
    const variantLabel = selectedVariant?.label || null;
    
    if (isBuyNow) {
      // Buy Now: Prepare item for direct checkout
      const item = {
        productId: product._id,
        name: product.name,
        variant: variantLabel,
        quantity: quantity,
        price: getPrice(),
        categoryId: product.category?._id,
        categorySlug: product.category?.slug,
        isSubscription: false,
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
      // Add to Cart: Use existing addToCart function
      const result = await addToCart(
        product._id,
        variantLabel,
        quantity,
        deliveryDetails,
        product.category?._id,
        product.category?.slug
      );
      
      if (result.success) {
        toast.success(`Added to cart!`);
        setShowDeliveryModal(false);
      }
    }
    
    setIsAddingToCart(false);
    setShowDeliveryModal(false);
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

  const images = product?.images?.map(img => img.secure_url) || product?.image || [];

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="pt-4 sm:pt-6 pb-12 sm:pb-16 px-3 sm:px-4 md:px-6 lg:px-0 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">
        <div className="lg:w-1/2">
          <div className="aspect-square bg-gray-200 rounded-xl sm:rounded-2xl animate-pulse" />
          <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
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

  if (isLoading || shopLoading) {
    return <SkeletonLoader />;
  }

  if (!product) {
    return (
      <div className="text-center py-12 sm:py-16 px-4">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Product not found</p>
        <Link to="/collection" className="text-sm text-gray-600 hover:text-gray-900 underline mt-2 inline-block">
          Browse products
        </Link>
      </div>
    );
  }

  const outOfStock = isOutOfStock();
  const isLoggedIn = !!token;

  return (
    <>
      <div className="pt-4 sm:pt-6 pb-12 sm:pb-16 px-3 sm:px-4 md:px-6 lg:px-0 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-4 sm:mb-6 transition text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back
        </button>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">
          {/* Images */}
          <div className="lg:w-1/2">
            <div className="aspect-square bg-gray-50 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 relative">
              {image ? (
                <img className="w-full h-full object-cover" src={image} alt={product.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
              )}
              {outOfStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg sm:text-xl px-4 py-2 bg-red-600 rounded-lg">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setImage(img)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition ${
                      image === img ? "border-gray-900" : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img className="w-full h-full object-cover" src={img} alt={`Thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:w-1/2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">{product.name}</h1>
            
            {product.category && (
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{product.category.name}</p>
            )}

            {/* Price & Stock Status */}
            <div className="mt-3 sm:mt-4 flex items-center gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {currency}{getPrice()}
              </span>
              {product.pricingType === "variants" && product.variants?.length > 0 && (
                <span className="text-xs sm:text-sm text-gray-400 ml-2">
                  / {selectedVariant?.label || 'select plan'}
                </span>
              )}
              {outOfStock ? (
                <span className="text-xs sm:text-sm font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                  Out of Stock
                </span>
              ) : null}
            </div>

            {/* Variants */}
            {product.pricingType === "variants" && product.variants?.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Select Plan</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.label}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={outOfStock}
                      className={`px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl text-xs sm:text-sm transition ${
                        selectedVariant?.label === variant.label
                          ? "border-gray-900 bg-gray-50 text-gray-900 shadow-sm"
                          : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                      } ${outOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-medium text-xs sm:text-sm">{variant.label}</div>
                      <div className="text-gray-600 text-xs sm:text-sm">{currency}{variant.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-4 sm:mt-6">
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Quantity</p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1 || outOfStock || isAddingToCart}
                  className="w-10 h-10 sm:w-10 sm:h-10 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
                <span className="w-12 sm:w-12 text-center font-medium text-base sm:text-base">{quantity}</span>
                <button
                  onClick={increaseQuantity}
                  disabled={quantity >= 10 || outOfStock || isAddingToCart}
                  className="w-10 h-10 sm:w-10 sm:h-10 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
                <span className="text-[10px] sm:text-xs text-gray-400">
                  (Max 10)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 sm:mt-6">
              {product.description && (
                <p className="text-xs mb-2 text-gray-700">
                  * Please read the description below before proceeding
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock || !isLoggedIn || isAddingToCart}
                  className={`w-full sm:flex-1 flex items-center justify-center gap-2 px-6 sm:px-6 py-3.5 sm:py-3.5 font-medium rounded-xl transition text-base sm:text-base ${
                    outOfStock || !isLoggedIn || isAddingToCart
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-5 sm:h-5 animate-spin" />
                      Adding...
                    </>
                  ) : outOfStock ? (
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
                  disabled={outOfStock || !isLoggedIn || isAddingToCart}
                  className={`w-full sm:flex-1 flex items-center justify-center gap-2 px-6 sm:px-6 py-3.5 sm:py-3.5 font-medium rounded-xl transition text-base sm:text-base ${
                    outOfStock || !isLoggedIn || isAddingToCart
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-5 sm:h-5 animate-spin" />
                      Processing...
                    </>
                  ) : outOfStock ? (
                    'Unavailable'
                  ) : !isLoggedIn ? (
                    'Login to Buy'
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              {product.description ? (
                <FormattedDescription text={product.description} />
              ) : (
                <p className="text-sm text-gray-400">No description available</p>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((item) => {
                const itemOutOfStock = !item.inStock;
                const hasVariants = item.pricingType === "variants" && item.variants?.length > 0;
                
                let displayPrice = `${currency}${item.price}`;
                if (hasVariants) {
                  const prices = item.variants.map(v => v.price);
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  displayPrice = min === max ? `${currency}${min}` : `${currency}${min} - ${currency}${max}`;
                }

                return (
                  <Link
                    key={item._id}
                    to={`/product/${item._id}`}
                    className={`group bg-white border rounded-xl overflow-hidden transition ${
                      itemOutOfStock 
                        ? 'border-red-200 opacity-60 cursor-not-allowed' 
                        : 'border-gray-200 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div className="aspect-square bg-gray-50 overflow-hidden relative">
                      {item.images?.[0]?.secure_url ? (
                        <img 
                          src={item.images[0].secure_url} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" />
                        </div>
                      )}
                      {hasVariants && !itemOutOfStock && (
                        <span className="absolute bottom-2 right-2 text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-white/90 text-gray-700 font-medium shadow-sm backdrop-blur-sm">
                          {item.variants.length} plans
                        </span>
                      )}
                      {itemOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white font-bold text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 rounded-lg shadow-lg">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2 sm:p-3">
                      <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{item.name}</h4>
                      <p className="text-sm sm:text-base font-bold text-gray-900 mt-0.5 sm:mt-1">
                        {displayPrice}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delivery Details Modal */}
      <DeliveryDetailsModal
        isOpen={showDeliveryModal}
        onClose={() => {
          setShowDeliveryModal(false);
          setIsAddingToCart(false);
        }}
        onConfirm={handleDeliveryConfirm}
        product={product}
        isSubscription={false}
        backendUrl={backendUrl}
        loading={isAddingToCart}
        user={user}
        isBuyNow={isBuyNow}
      />
    </>
  );
};
 
export default Product;