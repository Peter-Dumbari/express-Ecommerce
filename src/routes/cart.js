import express from "express";
import auth from "../../middleware/auth.js";
import {
  addToCart,
  clearCart,
  getUserCart,
  removeFromCart,
  updateUserCart,
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/add", auth, addToCart);
router.get("/", auth, getUserCart);
router.put("/update", auth, updateUserCart);
router.delete("/clear", auth, clearCart);
router.delete("/remove/:productId", auth, removeFromCart);

export default router;
