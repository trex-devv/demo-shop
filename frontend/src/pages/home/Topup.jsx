import React, { useState, useEffect, useContext, useRef } from "react";
import { ShopContext } from "../../contexts/ShopContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Search,
  X,
  ShoppingCart,
  Loader2,
  Gamepad2,
  Star,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import DeliveryDetailsModal from "../../components/DeliveryDetailsModal.jsx";

const TopUp = () => {
  const navigate = useNavigate();
  const { backendUrl, currency, addToCart, products, token, user } =
    useContext(ShopContext);
  const [topUpProducts, setTopUpProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGame, setSelectedGame] = useState("all");
  const [categories, setCategories] = useState([]);
  const [addingToCart, setAddingToCart] = useState(null);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const searchRef = useRef(null);
  const stickyTriggerRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const topUps = products.filter(
        (p) =>
          p.category?.name?.toLowerCase().includes("topup") ||
          p.category?.name?.toLowerCase().includes("top-up") ||
          p.category?.slug?.includes("topup"),
      );
      setTopUpProducts(topUps.length > 0 ? topUps : products);
      setLoading(false);
    }
  }, [products]);

  // Sticky search with smooth transition
  useEffect(() => {
    const handleScroll = () => {
      if (stickyTriggerRef.current) {
        const rect = stickyTriggerRef.current.getBoundingClientRect();
        const shouldStick = rect.bottom < 0;
        setIsSearchSticky(shouldStick);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/category");
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {}
  };

  const handleAddToCart = (product) => {
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    if (!product.inStock) {
      toast.error("This product is out of stock");
      return;
    }

    // Show delivery details modal instead of directly adding to cart
    setSelectedProduct(product);
    setShowDeliveryModal(true);
  };

  const handleDeliveryConfirm = async (deliveryDetails) => {
    setAddingToCart(selectedProduct?._id);

    const variantLabel =
      selectedProduct.pricingType === "variants" &&
      selectedProduct.variants?.length > 0
        ? selectedProduct.variants[0].label
        : null;

    const result = await addToCart(
      selectedProduct._id,
      variantLabel,
      1,
      deliveryDetails,
      selectedProduct.category?._id,
      selectedProduct.category?.slug,
    );

    if (result.success) {
      setShowDeliveryModal(false);
      setSelectedProduct(null);
    }
    setAddingToCart(null);
  };

  const getPriceDisplay = (product) => {
    if (product.pricingType === "flat") {
      return `${currency}${product.price}`;
    } else {
      const prices = product.variants?.map((v) => v.price) || [];
      if (prices.length === 0) return `${currency}0`;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max
        ? `${currency}${min}`
        : `${currency}${min} - ${currency}${max}`;
    }
  };

  const filteredProducts = topUpProducts.filter((product) => {
    if (
      searchTerm &&
      !product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (selectedGame !== "all" && product.category?._id !== selectedGame) {
      return false;
    }
    return true;
  });

  const quickGames = categories.reverse().slice(0, 3);

  // Skeleton Loader Component
  const SkeletonCard = () => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/3 mt-1" />
        <div className="h-10 bg-gray-200 rounded w-full mt-2" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="pt-4 sm:pt-6 pb-12 sm:pb-16 px-3 sm:px-4 md:px-0">
        <div className="bg-gray-200 rounded-2xl h-40 sm:h-48 mb-6 sm:mb-10 animate-pulse" />
        <div className="flex gap-2 mb-4 sm:mb-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"
            />
          ))}
        </div>
        <div className="h-12 bg-gray-200 rounded-xl mb-4 sm:mb-6 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pt-4 sm:pt-6 pb-12 sm:pb-16 px-3 sm:px-4 md:px-0">
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl overflow-hidden mb-6 sm:mb-10">
          <div className="relative px-4 sm:px-8 py-8 sm:py-12 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
              Instant TopUps
            </h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto px-2">
              Browse in-game items for different games and services instantly.{" "}
              {quickGames.map((cat) => cat.name).join(", ")} & more.
            </p>
          </div>
        </div>

        {/* Sticky Trigger */}
        <div ref={stickyTriggerRef} className="h-0.5" />

        {/* Quick Games */}
        {categories.length > 0 && (
          <div className="flex overflow-x-auto gap-1.5 sm:gap-2 mb-4 sm:mb-6 pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <button
              onClick={() => setSelectedGame("all")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full border transition whitespace-nowrap flex-shrink-0 ${
                selectedGame === "all"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedGame(cat._id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full border transition whitespace-nowrap flex-shrink-0 ${
                  selectedGame === cat._id
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Search Bar - Smooth Sticky */}
        <div
          ref={searchRef}
          className={`transition-all duration-500 ease-in-out ${
            isSearchSticky
              ? "fixed top-16 left-0 right-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/50"
              : ""
          }`}
        >
          <div
            className={`${isSearchSticky ? "px-3 sm:px-4 md:px-6 py-2.5" : "px-0"}`}
          >
            <div className={`${isSearchSticky ? "max-w-6xl mx-auto" : ""}`}>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search games and services"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-9 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white transition-all duration-300 ${
                    isSearchSticky
                      ? "py-2.5 text-sm sm:text-base"
                      : "py-3 sm:py-3.5 text-base sm:text-lg"
                  }`}
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
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-200 mt-4">
            <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm sm:text-base">
              No product found
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-sm text-blue-500 hover:text-blue-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
            {filteredProducts.map((product) => {
              const hasVariants =
                product.pricingType === "variants" &&
                product.variants?.length > 0;
              const isAdding = addingToCart === product._id;
              const imageUrl = product.images?.[0]?.secure_url;
              const isOutOfStock = !product.inStock;

              return (
                <div
                  key={product._id}
                  className={`bg-white border rounded-xl overflow-hidden transition group ${
                    isOutOfStock
                      ? "border-red-200 opacity-60"
                      : "border-gray-200 hover:shadow-md"
                  }`}
                >
                  <Link to={`/product/${product._id}`} className="block">
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
                        </div>
                      )}
                      {product.isPopular && (
                        <span className="absolute top-2 left-2 text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-yellow-400 text-black font-medium flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                          <span className="hidden xs:inline">Popular</span>
                        </span>
                      )}
                      {hasVariants && (
                        <span className="absolute bottom-2 right-2 text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-white/90 text-gray-700 font-medium shadow-sm">
                          {product.variants.length} Products
                        </span>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 rounded-lg">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-3 sm:p-4">
                    <Link to={`/product/${product._id}`}>
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {product.name}
                      </h4>
                      {product.category && (
                        <p className="text-xs sm:text-sm text-gray-400 truncate">
                          {product.category.name}
                        </p>
                      )}
                    </Link>

                    <div className="mt-1.5 sm:mt-2">
                      <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                        {getPriceDisplay(product)}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (isOutOfStock) {
                          toast.error("This product is out of stock");
                          return;
                        }
                        if (hasVariants) {
                          navigate(`/product/${product._id}`);
                        } else {
                          handleAddToCart(product);
                        }
                      }}
                      disabled={isAdding || isOutOfStock}
                      className={`mt-2.5 sm:mt-3 w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition ${
                        isOutOfStock
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : isAdding
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : hasVariants
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                              : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                    >
                      {isAdding ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <>
                          {isOutOfStock ? (
                            <>
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span>Out of Stock</span>
                            </>
                          ) : hasVariants ? (
                            <>
                              <span>View Products</span>
                              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delivery Details Modal */}
      <DeliveryDetailsModal
        isOpen={showDeliveryModal}
        onClose={() => {
          setShowDeliveryModal(false);
          setSelectedProduct(null);
          setAddingToCart(null);
        }}
        onConfirm={handleDeliveryConfirm}
        product={selectedProduct}
        isSubscription={false}
        backendUrl={backendUrl}
        loading={addingToCart !== null}
        user={user}
      />
    </>
  );
};

export default TopUp;
