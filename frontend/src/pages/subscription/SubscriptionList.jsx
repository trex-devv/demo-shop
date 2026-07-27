import React, { useState, useEffect, useContext, useRef } from "react";
import { ShopContext } from "../../contexts/ShopContext";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  Loader2, Award, Search, X, 
  Star, AlertCircle, ChevronRight
} from "lucide-react";

const SubscriptionList = () => {
  const { backendUrl, currency } = useContext(ShopContext);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const searchRef = useRef(null);
  const stickyTriggerRef = useRef(null);

  const categoryOptions = ['Streaming', 'Music', 'Gaming', 'Shopping', 'Productivity', 'Other'];

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Sticky search with smooth transition
  useEffect(() => {
    const handleScroll = () => {
      if (stickyTriggerRef.current) {
        const rect = stickyTriggerRef.current.getBoundingClientRect();
        const shouldStick = rect.bottom < 0;
        setIsSearchSticky(shouldStick);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const getMinPrice = (sub) => {
    if (sub.variants && sub.variants.length > 0) {
      return Math.min(...sub.variants.map(v => v.price));
    }
    return 0;
  };

  const isOutOfStock = (sub) => {
    return !sub.isActive;
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (searchTerm && !sub.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterCategory !== "all" && sub.category !== filterCategory) {
      return false;
    }
    return true;
  });

  // Skeleton Loader
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse shadow-sm">
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
      <div className="pt-4 sm:pt-6 pb-12 sm:pb-16 px-3 sm:px-4 md:px-6 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="h-8 sm:h-10 bg-gray-200 rounded w-48 sm:w-64 animate-pulse" />
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-36 sm:w-48 mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 sm:pt-6 pb-12 sm:pb-16 px-3 sm:px-4 md:px-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-10">
        <div className="relative px-4 sm:px-6 md:px-10 py-8 sm:py-10 md:py-14 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
            Your Favorite Subscriptions, Instantly Delivered
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto px-2">
            Browse streaming, music, gaming, productivity and more subscriptions
          </p>
        </div>
      </div>

      {/* Sticky Trigger */}
      <div ref={stickyTriggerRef} className="h-0.5" />

      {/* Category Chips */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full border transition whitespace-nowrap ${
            filterCategory === "all"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          All
        </button>
        {categoryOptions.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full border transition whitespace-nowrap ${
              filterCategory === cat
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Bar - Smooth Sticky */}
      <div 
        ref={searchRef}
        className={`transition-all duration-500 ease-in-out ${
          isSearchSticky 
            ? 'fixed top-16 left-0 right-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/50' 
            : ''
        }`}
      >
        <div className={`${isSearchSticky ? 'px-3 sm:px-4 md:px-6 py-2.5' : 'px-0'}`}>
          <div className={`${isSearchSticky ? 'max-w-7xl mx-auto' : ''}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-9 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white transition-all duration-300 ${
                  isSearchSticky 
                    ? 'py-2.5 text-sm sm:text-base' 
                    : 'py-3 sm:py-3.5 text-base sm:text-lg'
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

      {/* Subscriptions Grid - Same UI as Product Cards */}
      {filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12 sm:py-16 md:py-20 bg-white rounded-xl sm:rounded-2xl border border-gray-200 mt-4">
          <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-500 text-base sm:text-lg">No subscriptions found</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
          {filteredSubscriptions.map((sub) => {
            const hasVariants = sub.variants && sub.variants.length > 0;
            const minPrice = getMinPrice(sub);
            const outOfStock = isOutOfStock(sub);
            const imageUrl = sub.images?.[0]?.secure_url;

            return (
              <div 
                key={sub._id} 
                className={`bg-white border rounded-xl overflow-hidden transition group ${
                  outOfStock ? 'border-red-200 opacity-60' : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <Link to={`/subscription/${sub.slug}`} className="block">
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={sub.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Award className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
                      </div>
                    )}
                    {sub.isPopular && (
                      <span className="absolute top-2 left-2 text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-yellow-400 text-black font-medium flex items-center gap-0.5">Popular</span>
                    )}
                    {hasVariants && (
                      <span className="absolute bottom-2 right-2 text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-white/90 text-gray-700 font-medium shadow-sm">
                        {sub.variants.length} plans
                      </span>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 rounded-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-3 sm:p-4">
                  <Link to={`/subscription/${sub.slug}`}>
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {sub.name}
                    </h4>
                    {sub.provider && (
                      <p className="text-xs sm:text-sm text-gray-400 truncate">{sub.provider}</p>
                    )}
                  </Link>

                  <div className="mt-1.5 sm:mt-2">
                    <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                      Rs. {minPrice}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (outOfStock) {
                        toast.error("This subscription is currently unavailable");
                        return;
                      }
                      window.location.href = `/subscription/${sub.slug}`;
                    }}
                    disabled={outOfStock}
                    className={`mt-2.5 sm:mt-3 w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition ${
                      outOfStock
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : hasVariants
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {outOfStock ? (
                      <>
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Out of Stock</span>
                      </>
                    ) : hasVariants ? (
                      <>
                        <span>View Plans</span>
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Add to Cart</span>
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
  );
};

export default SubscriptionList;