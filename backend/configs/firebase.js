import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import adminTokenModel from "../models/adminTokenModel.js";

// Initialize Firebase Admin once
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const sendFCMNotification = async (
  tokens,
  title,
  body,
  clickUrl = "/",
) => {
  try {
    if (!tokens || tokens.length === 0) {
      return {
        success: false,
        message: "No FCM tokens",
      };
    }

    const message = {
      tokens,
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        url: clickUrl,
      },
      webpush: {
        headers: {
          Urgency: "high",
          TTL: "3600",
        },
        notification: {
          title,
          body,
          icon: "/logo.png",
          badge: "/logo.png",
          requireInteraction: true,
        },
        fcmOptions: {
          link: clickUrl,
        },
      },
    };

    const response = await getMessaging().sendEachForMulticast(message);

    // Remove invalid tokens
    const invalidTokens = [];

    response.responses.forEach((r, index) => {
      if (!r.success) {
        const code = r.error?.code;

        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length) {
      await adminTokenModel.updateOne(
        {},
        {
          $pull: {
            fcmToken: { $in: invalidTokens },
          },
        },
      );
    }

    console.log(JSON.stringify(response, null, 2));

    return {
      success: true,
      response,
    };
  } catch (error) {
    console.error("FCM Error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};
