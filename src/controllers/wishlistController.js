import asyncHandler from "express-async-handler";
import { WishList } from "../models/wishlist.js";
import { Product } from "../models/product.js";

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  // Optional: check if product exists
  const productExists = await Product.findById(productId);
  if (!productExists) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Find user's wishlist
  let wishlist = await WishList.findOne({ user: req.user._id });

  // If wishlist does not exist, create one
  if (!wishlist) {
    wishlist = await WishList.create({
      user: req.user._id,
      products: [{ product: productId }],
    });

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      wishlist,
    });
  }

  // Check if product already exists in wishlist
  const alreadyExists = wishlist.products.some(
    (item) => item.product.toString() === productId
  );

  if (alreadyExists) {
    return res.status(400).json({
      message: "Product already in wishlist",
    });
  }

  // Add product to wishlist
  wishlist.products.push({ product: productId });
  await wishlist.save();

  return res.status(200).json({
    success: true,
    message: "Product added to wishlist",
    wishlist,
  });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await WishList.findOne({ user: req.user._id }).populate(
    "products.product"
  );

  if (!wishlist) {
    return res.status(200).json({
      count: 0,
      items: [],
    });
  }

  return res.status(200).json({
    count: wishlist.products.length,
    items: wishlist.products,
  });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const wishlist = await WishList.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: { product: productId } } },
    { new: true }
  );

  if (!wishlist) {
    return res.status(404).json({
      success: false,
      message: "Wishlist not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Product removed from wishlist",
    wishlist,
  });
});
