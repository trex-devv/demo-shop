import React, { useState, useEffect, useContext } from "react";
import { ShopContext } from "../../contexts/ShopContext";
import axios from "axios";
import Hero from "../../components/Home/Hero";
import Category from "../../components/Home/Category";
import FeaturedProducts from "../../components/Home/FeaturedProducts";
import FeaturedSubscriptions from "../../components/Home/FeaturedSubscriptions";
import WhyChooseUs from "../../components/Home/WhyChooseUs";

const Home = () => {
  const { backendUrl, products, currency } = useContext(ShopContext);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHomeData();
  }, [products]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const catRes = await axios.get(`${backendUrl}/api/category`);
      if (catRes.data.success) {
        setCategories(catRes.data.categories || []);
      }

      // Fetch subscriptions - try both possible endpoints
      try {
        const subRes = await axios.get(`${backendUrl}/api/subscription/`);
        if (subRes.data.success) {
          setSubscriptions(subRes.data.subscriptions || []);
        }
      } catch (subError) {
        console.warn("Subscriptions endpoint not available:", subError.message);
        // Set empty array if subscriptions not available
        setSubscriptions([]);
      }

      // Filter products
      if (products.length > 0) {
        const inStockProducts = products.filter(p => p.inStock !== false);
        const featured = inStockProducts.filter(p => p.isFeatured === true);
        setFeaturedProducts(featured.length > 0 ? featured.slice(0, 8) : inStockProducts.slice(0, 8));
      }

    } catch (error) {
      console.error("Error fetching home data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-gray-600 text-center">{error}</p>
        <button
          onClick={fetchHomeData}
          className="mt-4 px-6 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Hero />
      <Category categories={categories} />
      <FeaturedProducts products={featuredProducts} currency={currency} />
      {subscriptions.length > 0 && (
        <FeaturedSubscriptions subscriptions={subscriptions} currency={currency} />
      )}
      <WhyChooseUs />
    </div>
  );
};

export default Home;