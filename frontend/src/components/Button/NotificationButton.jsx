import { getToken } from "firebase/messaging";
import { messaging } from "../../firebase.js"
import axios from "axios";

export default function NotificationButton() {
  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (token) {
          console.log("FCM Token:", token);
          
          await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/user/save-fcm-token`, 
            { token },
            { withCredentials: true }
          );

          alert("Notifications enabled successfully!");
        }
      } else {
        alert("Permission denied for notifications.");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
    }
  };

  return (
    <button 
      onClick={enableNotifications}
      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
    >
      Enable Push Notifications 🔔
    </button>
  );
}