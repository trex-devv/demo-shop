import React, { useState, useEffect, useContext } from "react";
import { ShopContext } from "../../contexts/ShopContext";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  Loader2, Gamepad2, ArrowLeft, Package, ChevronRight, Award, AlertCircle
} from "lucide-react";

const Collection = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const navigate = useNavigate();
  const { backendUrl, currency, products } = useContext(ShopContext);
  
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchSubscriptions();
  }, []);

  // Reset subcategory when category changes
  useEffect(() => {
    if (categorySlug) {
      const cat = categories.find(c => c.slug === categorySlug);
      if (cat) {
        setSelectedCategory(cat);
        setSelectedSubcategory(null);
        fetchSubcategories(cat._id);
      }
    } else {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSubcategories([]);
      setFilteredProducts([]);
    }
  }, [categorySlug, categories]);

  // Find subcategory from URL when subcategories change
  useEffect(() => {
    if (subcategorySlug && subcategories.length > 0) {
      const sub = subcategories.find(s => s.slug === subcategorySlug);
      if (sub) {
        setSelectedSubcategory(sub);
      } else {
        setSelectedSubcategory(null);
      }
    } else if (!subcategorySlug) {
      setSelectedSubcategory(null);
    }
  }, [subcategorySlug, subcategories]);

  // Filter products when category or subcategory changes
  useEffect(() => {
    if (selectedCategory) {
      let filtered = products.filter(p => 
        p.category?._id === selectedCategory._id || 
        p.category === selectedCategory._id
      );
      
      if (selectedSubcategory) {
        filtered = filtered.filter(p => 
          p.subCategory?._id === selectedSubcategory._id || 
          p.subCategory === selectedSubcategory._id
        );
      }
      
      setFilteredProducts(filtered);
      setLoading(false);
    } else {
      setFilteredProducts([]);
      setLoading(false);
    }
  }, [selectedCategory, selectedSubcategory, products]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/category");
      if (response.data.success) {
        setCategories(response.data.categories || []);
        setLoading(false);
      }
    } catch (error) {
      toast.error("Failed to load categories");
      setLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const response = await axios.get(backendUrl + `/api/subcategory/category/${categoryId}`);
      if (response.data.success) {
        setSubcategories(response.data.subcategories || []);
      }
    } catch (error) {
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/subscription");
      if (response.data.success) {
        setSubscriptions(response.data.subscriptions || []);
      }
    } catch (error) {
    }
  };

  // Get product count for a category
  const getCategoryProductCount = (categoryId) => {
    return products.filter(p => 
      p.category?._id === categoryId || p.category === categoryId
    ).length;
  };

  // Get product count for a subcategory
  const getSubcategoryProductCount = (subcategoryId) => {
    return products.filter(p => 
      p.subCategory?._id === subcategoryId || p.subCategory === subcategoryId
    ).length;
  };

  // Check if product is out of stock
  const isOutOfStock = (product) => {
    return !product.inStock;
  };

  // Skeleton Loading
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-5 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="pt-6 pb-16 px-4 sm:px-0">
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-48 mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Categories View
  if (!categorySlug) {
    return (
      <div className="pt-6 pb-16 px-4 sm:px-0">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Browse Categories</h1>
          <p className="text-gray-500 mt-1.5">Browse the categories of game, apps or services</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No categories available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((cat) => {
              const count = getCategoryProductCount(cat._id);
              return (
                <Link
                  key={cat._id}
                  to={`/collection/${cat.slug}`}
                  className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gray-200 hover:shadow-lg transition"
                >
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Gamepad2 className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 text-white">
                    <h3 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg truncate">{cat.name}</h3>
                    <p className="text-[10px] sm:text-xs text-white/70">{count} products</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Browse Subscriptions Section */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse Subscriptions</h2>
              <p className="text-sm text-gray-500 mt-0.5">Subscribe to your favorite services</p>
            </div>
          </div>

          {subscriptions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No subscriptions available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {subscriptions.slice(0, 5).map((sub) => (
                <Link
                  key={sub._id}
                  to={`/subscription/${sub.slug}`}
                  className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gray-200 hover:shadow-lg transition"
                >
                  {sub.images?.[0]?.secure_url ? (
                    <img 
                      src={sub.images[0].secure_url} 
                      alt={sub.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Award className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 text-white">
                    <h3 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg truncate">{sub.name}</h3>
                    <p className="text-[10px] sm:text-xs text-white/70">
                      From Rs. {Math.min(...sub.variants.map(v => v.price))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Subcategories View
  if (selectedCategory && subcategories.length > 0 && !subcategorySlug) {
    return (
      <div className="pt-6 pb-16 px-4 sm:px-0">
        <button
          onClick={() => navigate('/collection')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">{selectedCategory.name}</h1>
          <p className="text-gray-500 mt-1.5">Choose a subcategory</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {subcategories.map((sub) => {
            const count = getSubcategoryProductCount(sub._id);
            return (
              <Link
                key={sub._id}
                to={`/collection/${selectedCategory.slug}/${sub.slug}`}
                className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gray-200 hover:shadow-lg transition"
              >
                {sub.image ? (
                  <img 
                    src={sub.image} 
                    alt={sub.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 group-hover:scale-105 transition duration-300">
                    <span className="text-3xl sm:text-5xl">📂</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 text-white">
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg truncate">{sub.name}</h3>
                  <p className="text-[10px] sm:text-xs text-white/70">{count} products</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Products View
  if (selectedCategory) {
    const isSubcategory = subcategorySlug && selectedSubcategory;
    const title = isSubcategory ? selectedSubcategory?.name : selectedCategory.name;

    return (
      <div className="pt-6 pb-16 px-4 sm:px-0">
        <button
          onClick={() => {
            if (isSubcategory) {
              navigate(`/collection/${selectedCategory.slug}`);
            } else {
              navigate('/collection');
            }
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">{filteredProducts.length} products</p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const outOfStock = !product.inStock;
              const hasVariants = product.pricingType === "variants" && product.variants?.length > 0;
              
              // Get display price
              let displayPrice = `${currency}${product.price}`;
              if (hasVariants) {
                const prices = product.variants.map(v => v.price);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                displayPrice = min === max ? `${currency}${min}` : `${currency}${min} - ${currency}${max}`;
              }
              
              return (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className={`group bg-white border rounded-xl overflow-hidden transition ${
                    outOfStock ? 'border-red-200 opacity-60' : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
                    {product.images?.[0]?.secure_url ? (
                      <img 
                        src={product.images[0].secure_url} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
                      </div>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-xs sm:text-sm px-3 py-1.5 bg-red-600 rounded-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}
                    {hasVariants && (
                      <span className="absolute bottom-2 right-2 text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-white/90 text-gray-700 font-medium shadow-sm">
                        {product.variants.length} products
                      </span>
                    )}
                  </div>
                  <div className="p-2.5 sm:p-4">
                    <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{product.name}</h4>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mt-0.5 sm:mt-1">
                      {displayPrice}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16 px-4">
      <p className="text-gray-500">Category not found</p>
      <Link to="/collection" className="text-sm text-gray-600 hover:text-gray-900 underline mt-2 inline-block">
        Browse categories
      </Link>
    </div>
  );
};

export default Collection;