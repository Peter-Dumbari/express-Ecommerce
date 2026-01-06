import asyncHandler from "express-async-handler";
import { Order } from "../models/order.js";
import flw from "../../config/flutterwave.js";
import axios from "axios";

export const createOrder = asyncHandler(async (req, res) => {
  const {
    products,
    totalAmount,
    customerEmail,
    customerName,
    paymentMethod,
    shippingAddress,
  } = req.body;

  if (!products || products.length === 0) {
    return res.status(400).json({ message: "No products provided" });
  }

  const items = products.map((prod) => ({
    product: prod.product._id, // assuming each product object has an id
    quantity: prod.quantity,
    price: prod.product.price,
  }));

  const order = await Order.create({
    user: req.user._id,
    items,
    totalAmount,
    shippingAddress,
    paymentMethod,
  });

  if (paymentMethod === "cod") {
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  }

  if (paymentMethod === "flutterwave") {
    const payload = {
      tx_ref: `order-${Date.now()}`,
      amount: totalAmount,
      name: "Tams E-Commerce Order",
      interval: "daily",
      currency: "NGN",
      payment_options: "card,ussd,banktransfer",
      redirect_url: `${process.env.CLIENT_URL}/orderhistory`,
      customer: {
        email: customerEmail,
        name: customerName,
      },
      meta: {
        products,
        shippingAddress,
      },
      customizations: {
        title: "Tams eShop",
        description: "Order payment",
      },
    };

    // ✅ CORRECT METHOD
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const order = await Order.create({
      user: req.user._id,
      products,
      totalAmount,
      customerEmail,
      shippingAddress,
      paymentMethod: "flutterwave",
    });

    return res.status(201).json({
      success: true,
      message: "Payment initialized",
      order,
      link: response.data.data.link,
    });
  }
  return res.status(500).json({ message: "Invalid Payment Method" });
});

export const verifyFlutterWavePayment = asyncHandler(async (req, res) => {
  const { transaction_id } = req.query;

  if (!transaction_id) {
    return res.status(400).json({ message: "Transaction ID missing" });
  }

  const verify = await flw.Transaction.verify({ transaction_id });
  if (verify.status === "success" && verify.data.status === "successful") {
    const products = verify.data.meta.products;

    await Order.create({
      products,
      totalAmount: verify.data.amount,
      customerEmail: verify.data.customer.email,
      shippingAddress,
      paymentMethod: "flutterwave",
      status: "Paid",
      transactionId: verify.data.id,
    });

    return res.json({
      success: true,
      message: "Payment verified & order created",
    });
  }
  return res.status(400).json({
    success: false,
    message: "Payment verification failed",
  });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const orders = await Order.find({ user: userId }).sort({
    createdAt: -1,
  });

  res.json({ success: true, orders });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate("user", "name email")
    .populate({
      path: "items.product",
      select: "name price images stock",
    });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json({ success: true, order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const valid = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"];

  if (!valid.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });

  res.json({
    success: true,
    message: "Order status updated",
    order: updated,
  });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.status === "Shipped" || order.status === "Delivered") {
    return res
      .status(400)
      .json({ message: "Order can no longer be cancelled" });
  }

  order.status = "Cancelled";
  await order.save();

  res.json({ success: true, message: "Order cancelled successfully" });
});
