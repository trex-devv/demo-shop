importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyDd2aF4WY-xMT_ZT5_G4ITAn1NUwTlXlUQ",
  authDomain: "testing-416d7.firebaseapp.com",
  projectId: "testing-416d7",
  storageBucket: "testing-416d7.firebasestorage.app",
  messagingSenderId: "343143623091",
  appId: "1:343143623091:web:0b258f4982a2e45d6b83c6",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background Message:", payload);

  self.registration.showNotification(
    payload.notification?.title || "Notification",
    {
      body: payload.notification?.body || "",
      icon: "/logo.png",
      data: payload.data,
    },
  );
});
