import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize safely using environment variables
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const sendFCMNotification = async (token, title, body, clickUrl = '/') => {
  try {
    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: {
        url: clickUrl,
      },
    };

    const response = await getMessaging().send(message);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending notification', error);
    return { success: false, error: error.message };
  }
};