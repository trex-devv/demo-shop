import { getMessaging } from "firebase-admin/messaging";

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
      notification: {
        title,
        body,
      },
      data: {
        url: clickUrl,
      },
      tokens,
    };

    const response = await getMessaging().sendEachForMulticast(message);

    return {
      success: true,
      response,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: error.message,
    };
  }
};
