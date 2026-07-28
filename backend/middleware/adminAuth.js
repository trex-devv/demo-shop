import jwt from "jsonwebtoken";
import adminTokenModel from "../models/adminTokenModel.js";

export const adminAuth = (req, res, next) => {
  try {
    // First check for JWT token (from admin login)
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.isAdmin) {
        req.admin = decoded;
        return next();
      }
    }

    // Fallback: Check for Basic Auth (for backward compatibility)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Basic ")) {
      const base64 = authHeader.split(" ")[1];
      const [email, password] = Buffer.from(base64, "base64")
        .toString()
        .split(":");

      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (email === adminEmail && password === adminPassword) {
        return next();
      }
    }

    res.status(401).json({
      success: false,
      message: "Admin authentication required",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const saveAdminFCMToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    let doc = await adminTokenModel.findOne();

    if (!doc) {
      doc = new adminTokenModel({
        fcmTokens: [token],
      });
    } else {
      // Remove duplicate if it already exists
      doc.fcmTokens = doc.fcmTokens.filter((t) => t !== token);

      // Add newest token to the front
      doc.fcmTokens.unshift(token);

      // Keep only latest 3
      doc.fcmTokens = doc.fcmTokens.slice(0, 3);

      doc.updatedAt = new Date();
    }

    await doc.save();

    res.json({
      success: true,
      message: "Token saved successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
