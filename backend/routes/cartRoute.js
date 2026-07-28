import express from "express";
import {
  getCart,
  getCartCount,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCart,
  addSubscriptionToCart,
} from "../controllers/cartController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getCart);
router.get("/count", auth, getCartCount);
router.post("/add", auth, addToCart);
router.post("/add-subscription", auth, addSubscriptionToCart);
router.put("/:itemId", auth, updateCartItem);
router.delete("/:itemId", auth, removeFromCart);
router.delete("/", auth, clearCart);
router.get("/validate", auth, validateCart);

export default router;
