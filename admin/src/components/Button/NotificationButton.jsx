import React, { useState, useEffect } from 'react';
import { getToken } from "firebase/messaging";
import { messaging } from "../../../firebase";
import { Bell, BellOff } from "lucide-react";

function NotificationButton() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Check initial permission state
    if (Notification.permission === "granted") {
      setIsEnabled(true);
    }
  }, []);

  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        // Wait for the custom service worker ready state to avoid default worker fallback errors
        const registration = await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          console.log("YOUR ADMIN FCM TOKEN:", token);
          setIsEnabled(true);
          alert("Notifications enabled! Check your browser console (F12) to copy your token.");
        }
      } else {
        setIsEnabled(false);
        alert("Notification permission was denied.");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
    }
  };

  return (
    <div className="relative group inline-block">
      <button 
        onClick={enableNotifications}
        aria-label="Toggle Notifications"
        className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm ${
          isEnabled 
            ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
            : "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
        }`}
      >
        {isEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      </button>

      {/* Cool Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
        <div className="bg-gray-900 text-white text-xs font-medium py-1 px-2.5 rounded shadow-lg whitespace-nowrap dark:bg-gray-700">
          {isEnabled ? "Notifications Enabled" : "Enable Notifications"}
        </div>
        <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -mt-1"></div>
      </div>
    </div>
  );
}

export default NotificationButton;