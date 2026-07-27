import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Add from "./pages/Add";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Categories from "./pages/Categories";
import Subcategories from "./pages/Subcategories";
import Payments from "./pages/Payments";
import ViewProduct from "./pages/ViewProduct";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Tickets from "./pages/Tickets";


import Login from "./components/Login";
import siteConfig from "./config/site.config";

import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Subscriptions from "./pages/Subscriptions";
import AddSubscription from "./pages/AddSubscriptions";
import FieldManagement from "./pages/FieldManagement";
import OrderDetails from "./pages/OrderDetails";
import UserOrders from "./pages/UserOrders";
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import axios from "axios";
import DeveloperDashboard from "./pages/DevPanel";


export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
export const currency = siteConfig.currency.symbol;

const App = () => {
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") ? localStorage.getItem("adminToken") : ""
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("adminToken", token);
  }, [token]);

  // Sync FCM token to backend
  useEffect(() => {
    if (token) {
      const syncFCMToken = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            // Build dynamic SW URL with env query parameters for white-label support
            const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
            const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
            const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
            const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
            const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
            const appId = import.meta.env.VITE_FIREBASE_APP_ID;

            const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(apiKey)}&authDomain=${encodeURIComponent(authDomain)}&projectId=${encodeURIComponent(projectId)}&storageBucket=${encodeURIComponent(storageBucket)}&messagingSenderId=${encodeURIComponent(messagingSenderId)}&appId=${encodeURIComponent(appId)}`;

            // Register service worker with the parameterized URL
            const registration = await navigator.serviceWorker.register(swUrl);
            
            const fcmToken = await getToken(messaging, { 
              serviceWorkerRegistration: registration,
              vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
            });

            if (fcmToken) {
              await axios.post(`${backendUrl}/api/admin/save-token`, { token: fcmToken }, {
                headers: {Authorization: `Bearer ${token}`} 
              });
              console.log("FCM Token successfully synced.");
            }
          }
        } catch (err) {
          console.error("Failed to sync FCM token:", err);
        }
      };

      syncFCMToken();
    }
  }, [token]);

  // Foreground notification listener
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      if (Notification.permission === "granted") {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/logo.png'
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer />
      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar setToken={setToken} onMenuToggle={() => setMobileOpen(!mobileOpen)} />
          <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          
          <main className="pt-16 lg:pl-64 min-h-screen">
            <div className="p-4 md:p-6">
              <Routes>
                <Route path="/" element={<Dashboard token={token} />} />
                <Route path="/dashboard" element={<Dashboard token={token} />} />
                <Route path="/add" element={<Add token={token} />} />
                <Route path="/list" element={<Products token={token} />} />
                <Route path="/view/:id" element={<ViewProduct token={token} />} />
                <Route path="/edit/:id" element={<Add token={token} />} />
                <Route path="/categories" element={<Categories token={token} />} />
                <Route path="/subcategories" element={<Subcategories token={token} />} />
                <Route path="/orders" element={<Orders token={token} />} />
                <Route path="/orders/:id" element={<OrderDetails token={token} />} />
                <Route path="/user-orders/:userId" element={<UserOrders token={token} />} />
                <Route path="/payments" element={<Payments token={token} />} />
                <Route path="/users" element={<Users token={token} />} />
                <Route path="/tickets" element={<Tickets token={token} />} />
                <Route path="/fields" element={<FieldManagement token={token} />} />

                <Route path="/dev" element={<DeveloperDashboard />} />
                
                <Route path="/subscriptions" element={<Subscriptions token={token} />} />
                <Route path="/subscriptions/add" element={<AddSubscription token={token} />} />
                <Route path="/subscriptions/edit/:id" element={<AddSubscription token={token} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default App;