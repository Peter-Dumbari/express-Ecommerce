import { v2 as cloudinary } from "cloudinary";
import { Product } from "../models/product.js";
import asyncHandler from "express-async-handler";

// export const createProduct = asyncHandler(async (req, res) => {
//   const { name, description, price, category, discountPrice, stock } = req.body;
//   // images can come from req.files (uploaded) or req.body.images (urls)
//   const images = req.files;

//   if (!images || images.length === 0) {
//     return res
//       .status(400)
//       .json({ message: "At least one product image is required." });
//   }

//   // Format images properly
//   // If using multer, req.files will be an array of file objects
//   const formattedImages = Array.isArray(images);
//   images.map((img) => ({
//     url: img.path || img.url,
//     public_id: img.filename || img.public_id || null,
//   }));

//   const newProduct = await Product.create({
//     name,
//     description,
//     price,
//     category,
//     discountPrice,
//     images: formattedImages,
//     stock,
//   });

//   return res.status(201).json({
//     message: "Product created successfully",
//     product: newProduct,
//   });
// });

export const createProduct = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    const images = req.files.map((file) => ({
      url: file.path, // e.g. uploads/12345-img.jpg
      public_id: file.filename, // unique enough for now
    }));

    const product = await Product.create({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      discountPrice: req.body.discountPrice,
      stock: req.body.stock,
      images, // ✅ MATCHES SCHEMA
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllProducts = asyncHandler(async (req, res) => {
  const product = await Product.find().populate("category", "name");
  // .populate("reviews.user", "name");

  if (!product) return res.status(404).json({ message: "No products found" });

  return res.status(200).json({ success: true, product });
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id).populate("category", "name");
  // .populate("reviews.user", "name");

  if (!product) return res.status(404).json({ message: "Product not found" });

  const relatedProducts = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id },
  }).populate("category", "name");

  // 3. Return both
  return res.status(200).json({
    success: true,
    product,
    relatedProducts,
  });

  return res.status(200).json({ success: true, product });
});

export const productUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    validators: true,
  });

  return res.status(200).json({
    message: "Product updated successfully",
    success: true,
    updatedProduct,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  if (product.images && product.images.length > 0) {
    for (const img of product.images) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }
  }
  await Product.findByIdAndDelete(id);
  return res
    .status(200)
    .json({ message: "Product deleted successfully", success: true });
});

export const addProductReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const alreadyReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString(),
  );

  if (alreadyReviewed) {
    return res.status(400).json({ message: "Product already reviewed" });
  }

  const review = {
    user: req.user._id,
    rating: Number(rating),
    product: id,
    comment,
  };

  product.reviews.push(review);
  product.numReviews = product.reviews.length;
  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save();
  return res
    .status(201)
    .json({ message: "Review added successfully", success: true });
});

export const deleteProductReview = asyncHandler(async (req, res) => {
  const { id, reviewId } = req.params;

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const review = product.reviews.find(
    (rev) => rev._id.toString() === reviewId.toString(),
  );

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return res
      .status(401)
      .json({ message: "Not authorized to delete this review" });
  }

  product.reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== reviewId.toString(),
  );

  product.numReviews = product.reviews.length;
  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    (product.reviews.length === 0 ? 1 : product.reviews.length);

  await product.save();
  return res
    .status(200)
    .json({ message: "Review deleted successfully", success: true });
});

export const getProductByCategory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Product.find({ category: id }).populate(
      "category",
      "name",
    );
    // .populate("reviews.user", "name");

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this category" });
    }

    return res.status(200).json({ success: true, products });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
});
