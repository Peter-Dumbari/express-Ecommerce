import express from "express";
import auth from "../../middleware/auth.js";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.post("/create", auth, addToWishlist);
router.get("/", auth, getWishlist);
router.delete("/:productId", auth, removeFromWishlist);

export default router;
