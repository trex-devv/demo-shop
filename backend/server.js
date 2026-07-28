import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoute.js";
import cartRoutes from "./routes/cartRoute.js";
import categoryRoutes from "./routes/categoryRoute.js";
import orderRoutes from "./routes/orderRoute.js";
import productRoutes from "./routes/productRoute.js";
import subcategoryRoutes from "./routes/subcategoryRoute.js";
import paymentRoutes from "./routes/paymentRoute.js";
import dashboardRoutes from "./routes/dashboardRoute.js";
import fieldRoutes from "./routes/fieldRoute.js";
import userRoutes from "./routes/userRoute.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import devRoutes from "./routes/devRoutes.js";
import adminTokenModel from "./models/adminTokenModel.js";
import { sendFCMNotification } from "./configs/firebase.js";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const admin = process.env.ADMIN_WEBSITE_URL;
const user = process.env.USER_WEBSITE_URL;

const router = express.Router();

// Middleware
app.use(
  cors({
    origin: ["*", user, admin],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-dev-password",
      "X-Dev-Password",
      "X-Requested-With",
      "Accept",
      "token",
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/product", productRoutes);
app.use("/api/subcategory", subcategoryRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ticket", ticketRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/fields", fieldRoutes);
app.use("/api/dev", devRoutes);

router.get("/test-notification", async (req, res) => {
  const doc = await adminTokenModel.findOne();

  await sendFCMNotification([doc.fcmToken[0]], "TEst", "Hello notification");

  res.json({ success: true, message: "SENTT" });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong!",
  });
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

export default app;
