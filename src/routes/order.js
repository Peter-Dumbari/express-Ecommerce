import express from "express";
import { auth, optionalAuth } from "../../middleware/auth.js";
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  verifyFlutterWavePayment,
} from "../controllers/orderController.js";
import isAdminOnly from "../../middleware/isAdmin.js";

const router = express.Router();

router.post("/create", optionalAuth, createOrder);
router.get("/verify-payment", auth, verifyFlutterWavePayment);
router.get("/user", optionalAuth, getUserOrders);
router.get("/:id", optionalAuth, getOrderById);
router.get("/all", auth, isAdminOnly, getAllOrders);
router.put("/:id/status", auth, isAdminOnly, updateOrderStatus);
router.put("/:id/cancel", auth, cancelOrder);

export default router;
