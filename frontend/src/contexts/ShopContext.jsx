import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import siteConfig from "../config/site.config.js";
import { toast } from "react-toastify";

export const ShopContext = createContext();

export const ShopContextProvider = (props) => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://192.168.100.30:3000";
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({
    items: [],
    summary: { subtotal: 0, totalItems: 0 },
  });
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product`);
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
      }
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart
  const fetchCart = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${backendUrl}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (error) {}
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await axios.get(`${backendUrl}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.success) {
            setUser(response.data.user);
          }
        } catch (error) {}
      }
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    fetchProducts();
    if (token) {
      fetchCart();
    }
  }, [token]);

  // Add to Cart (for products only)
  const addToCart = async (
    productId,
    variant = null,
    quantity = 1,
    deliveryDetails = null,
    categoryId = null,
    categorySlug = null,
  ) => {
    if (!token) {
      toast.error("Please login first");
      return { success: false };
    }

    try {
      setLoading(true);

      const requestData = {
        productId,
        variant,
        quantity,
        categoryId,
        categorySlug,
      };

      if (deliveryDetails) {
        requestData.deliveryDetails = deliveryDetails;
      }

      const response = await axios.post(
        `${backendUrl}/api/cart/add`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setCart(response.data.cart);
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to add to cart";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Add Subscription to Cart (for subscriptions only)
  const addSubscriptionToCart = async (
    subscriptionId,
    variant,
    quantity = 1,
    deliveryDetails = null,
    name,
    price,
    variantLabel,
    duration,
  ) => {
    if (!token) {
      toast.error("Please login first");
      return { success: false };
    }

    try {
      setLoading(true);

      const requestData = {
        subscriptionId,
        variant,
        quantity,
        name,
        price,
        variantLabel,
        duration,
      };

      if (deliveryDetails) {
        requestData.deliveryDetails = deliveryDetails;
      }

      const response = await axios.post(
        `${backendUrl}/api/cart/add-subscription`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setCart(response.data.cart);
        return { success: true };
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to add subscription to cart";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = async (itemId, quantity) => {
    if (!token) {
      toast.error("Please login first");
      return { success: false };
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `${backendUrl}/api/cart/${itemId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setCart(response.data.cart);
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update item";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCartItem = async (itemId) => {
    if (!token) {
      toast.error("Please login first");
      return { success: false };
    }

    try {
      setLoading(true);
      const response = await axios.delete(`${backendUrl}/api/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCart(response.data.cart);
        toast.success("Item removed from cart");
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to remove item";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearUserCart = async () => {
    if (!token) {
      toast.error("Please login first");
      return { success: false };
    }

    try {
      setLoading(true);
      const response = await axios.delete(`${backendUrl}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCart(response.data.cart);
        toast.success("Cart cleared");
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to clear cart";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    backendUrl,
    products,
    cart,
    token,
    loading,
    user,
    currency: siteConfig.currency.symbol,
    setToken,
    setUser,
    fetchProducts,
    fetchCart,
    addToCart,
    addSubscriptionToCart,
    updateCartItemQuantity,
    removeFromCartItem,
    clearUserCart,
    setCart,
    cartCount: cart?.summary?.totalItems || 0,
    subtotal: cart?.summary?.subtotal || 0,
    cartItems: cart?.items || [],
    setCartItems: (items) => {
      setCart({ ...cart, items: items || [] });
    },
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
