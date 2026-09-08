import express from "express";
import { auth, optionalAuth } from "../../middleware/auth.js";
import {
  addToCart,
  clearCart,
  getUserCart,
  removeFromCart,
  updateUserCart,
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/add", optionalAuth, addToCart);
router.get("/", optionalAuth, getUserCart);
router.put("/update", optionalAuth, updateUserCart);
router.delete("/clear", optionalAuth, clearCart);
router.delete("/remove/:productId", optionalAuth, removeFromCart);

export default router;
