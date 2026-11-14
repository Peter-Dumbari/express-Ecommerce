import asyncHandler from "express-async-handler";
import { Product } from "../models/product.js";
import { Cart } from "../models/cart.js";
import crypto from "crypto";

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // let cart = await Cart.findOne({ user: userID });
  let cart;

  if (req.user) {
    const userID = req.user._id;

    cart = await Cart.findOne({ user: userID });

    if (!cart) {
      cart = await Cart.create({
        user: userID,
        items: [{ product: productId, quantity }],
      });
      return res.status(201).json(cart);
    }
  } else {
    let guestId = req.cookies.guestId;
    if (!guestId) {
      guestId = crypto.randomUUID();

      res.cookie("guestId", guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }
    cart = await Cart.findOne({ guestId });

    if (!cart) {
      cart = await Cart.create({
        guestId,
        items: [
          {
            product: productId,
            quantity,
          },
        ],
      });
      return res.status(201).json(cart);
    }
  }

  // If cart exists → check if product already inside
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId,
  );

  if (itemIndex !== -1) {
    // Update quantity
    cart.items[itemIndex].quantity += quantity;
  } else {
    // Add new product
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  res.status(200).json(cart);
});

// export const getUserCart = asyncHandler(async (req, res) => {
//   try {
//     const cart = await Cart.findOne({ user: req.user._id }).populate({
//       path: "items.product",
//       select: "name price images stock",
//     });

//     if (!cart) return res.json({ items: [] });

//     return res.json(cart);
//   } catch (error) {
//     console.log("error", error);
//   }
// });

export const getUserCart = asyncHandler(async (req, res) => {
  try {
    let cart;

    if (req.user) {
      // Authenticated user
      cart = await Cart.findOne({
        user: req.user._id,
      }).populate({
        path: "items.product",
        select: "name price images stock",
      });
    } else {
      // Guest user
      const guestId = req.cookies.guestId;

      // Guest doesn't have a cart yet
      if (!guestId) {
        return res.json({ items: [] });
      }

      cart = await Cart.findOne({
        guestId,
      }).populate({
        path: "items.product",
        select: "name price images stock",
      });
    }

    if (!cart) {
      return res.json({ items: [] });
    }

    return res.json(cart);
  } catch (error) {
    console.log("error", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});
export const updateUserCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  let cart;

  if (req.user) {
    // Logged-in user
    const userId = req.user._id;

    cart = await Cart.findOne({ user: userId });
  } else {
    // Guest user
    const guestId = req.cookies.guestId;

    if (!guestId) {
      return res.status(400).json({
        message: "Guest ID not found",
      });
    }

    cart = await Cart.findOne({ guestId });
  }

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
    });
  }

  const item = cart.items.find((item) => item.product.toString() === productId);

  if (!item) {
    return res.status(404).json({
      message: "Item not in cart",
    });
  }

  if (quantity <= 0) {
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );
  } else {
    item.quantity = quantity;
  }

  await cart.save();

  res.status(200).json(cart);
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let cart;

  if (req.user) {
    // Authenticated user
    cart = await Cart.findOne({
      user: req.user._id,
    });
  } else {
    // Guest user
    const guestId = req.cookies.guestId;

    if (!guestId) {
      return res.status(404).json({
        message: "Guest cart not found",
      });
    }

    cart = await Cart.findOne({
      guestId,
    });
  }

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
    });
  }

  // Remove product from cart
  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId,
  );

  await cart.save();

  res.status(200).json(cart);
});

export const clearCart = asyncHandler(async (req, res) => {
  try {
    if (req.user?._id) {
      // Logged-in user
      await Cart.findOneAndDelete({
        user: req.user._id,
      });
    } else if (req.cookies?.guestId) {
      // Guest user
      await Cart.findOneAndDelete({
        guestId: req.cookies.guestId,
      });
    } else {
      return res.status(400).json({
        message: "No user or guest cart identified",
      });
    }

    res.json({
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.log("error", error);

    return res.status(500).json({
      message: `Server Error ${error.message}`,
    });
  }
});
