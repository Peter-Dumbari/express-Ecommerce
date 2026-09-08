import express from "express";
import { auth } from "../../middleware/auth.js";
import {
  createReview,
  deleteProductReview,
  getProductReviews,
} from "../controllers/reviewController.js";

const router = express.Router();

router.post("/:id/review", auth, createReview);
router.get("/:id/reviews", getProductReviews);
router.delete("/review/:reviewId", auth, deleteProductReview);

export default router;
