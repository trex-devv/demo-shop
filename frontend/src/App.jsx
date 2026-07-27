import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";


import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/home/Home";
import Collection from "./pages/home/Collection";
import TopUp from "./pages/home/Topup";
import Product from "./pages/product/Product";
import Orders from "./pages/profile/Orders";
import SubscriptionList from "./pages/subscription/SubscriptionList";
import Subscription from "./pages/subscription/Subscription";
import Cart from "./pages/cart/Cart";


import Login from "./pages/auth/Login";
import About from "./pages/extras/About";
import Contact from "./pages/extras/Contact";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import siteConfig from "./config/site.config";
import Checkout from "./pages/cart/Checkout";
import TermsPrivacy from "./pages/extras/Terms";
import Profile from "./pages/profile/Profile";

const App = () => {
  useEffect(() => {
    document.title = `${siteConfig.siteName} - ${siteConfig.tagline}`;
  }, []);

  return (
    <>
      <ToastContainer />
      <Navbar />
      <div className="px-3 sm:px-4 md:px-6 max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topup" element={<TopUp />} />
          
          <Route path="/collection" element={<Collection />} />
          <Route path="/collection/:categorySlug" element={<Collection />} />
          <Route path="/collection/:categorySlug/:subcategorySlug" element={<Collection />} />

          <Route path="/subscriptions" element={<SubscriptionList />} />
          <Route path="/subscription/:slug" element={<Subscription />} />
          <Route path="/subscription/id/:id" element={<Subscription />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms&privacy" element={<TermsPrivacy />} />

          <Route path="/product/:productId" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
};

export default App;