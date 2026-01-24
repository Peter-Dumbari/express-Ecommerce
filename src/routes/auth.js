import express from "express";
import {
  facebookLogin,
  forgotPassword,
  getAllUsers,
  googeLogin,
  loginUser,
  registerUser,
  resendVerificationEmail,
  resetPassword,
  verifyUser,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);
router.get("/all-users", getAllUsers);
router.post("/resend-verification", resendVerificationEmail);
router.post("/login", loginUser);
router.post("/google-login", googeLogin);
router.post("/facebook-login", facebookLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
export default router;
