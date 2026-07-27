import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

if ('serviceWorker' in navigator) {
  const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(firebaseConfig.apiKey)}&authDomain=${encodeURIComponent(firebaseConfig.authDomain)}&projectId=${encodeURIComponent(firebaseConfig.projectId)}&storageBucket=${encodeURIComponent(firebaseConfig.storageBucket)}&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId)}&appId=${encodeURIComponent(firebaseConfig.appId)}`;

  navigator.serviceWorker.register(swUrl)
    .then((registration) => {
      console.log('Notification Worker registered!');
    })
    .catch((err) => {
      console.error('Notification Worker failed:', err);
    });
}