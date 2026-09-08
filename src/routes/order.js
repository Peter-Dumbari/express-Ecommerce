import express from "express";
import { auth } from "../../middleware/auth.js";
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

router.post("/create", auth, createOrder);
router.get("/verify-payment", auth, verifyFlutterWavePayment);
router.get("/user", auth, getUserOrders);
router.get("/:id", auth, getOrderById);
router.get("/all", auth, isAdminOnly, getAllOrders);
router.put("/:id/status", auth, isAdminOnly, updateOrderStatus);
router.put("/:id/cancel", auth, cancelOrder);

export default router;
