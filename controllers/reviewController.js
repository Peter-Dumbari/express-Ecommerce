import asyncHandler from "express-async-handler";
import { Product } from "../models/product.js";
import { Review } from "../models/review.js";

export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;
  const userId = req.user._id;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let review = await Review.findOne({ product: productId, user: userId });

    if (review) {
      review.rating = rating;
      review.comment = comment || review.comment;
      await review.save();
    } else {
      review = await Review.create({
        product: productId,
        user: userId,
        rating,
        comment,
      });
    }
  } catch (error) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const reviews = await Review.find({ product: productId }).populate(
    "user",
    "name email"
  );

  res.json({ success: true, reviews });
  try {
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export const deleteProductReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.reviewId;

  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ message: "Review not found" });

  await review.deleteOne();

  // Recalculate ratings
  const reviews = await Review.find({ product: review.product });

  const avgRating = reviews.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  await Product.findByIdAndUpdate(review.product, {
    ratings: avgRating,
    numReviews: reviews.length,
  });

  res.json({ success: true, message: "Review deleted" });
  try {
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
