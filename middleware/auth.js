import jwt from "jsonwebtoken";
import { User } from "../src/models/user.js";
import asyncHandler from "express-async-handler";

export const auth = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("-password");
    if (!user)
      return res.status(401).json({ error: "Invalid token - user not found" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalid or expired" });
  }
};

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  // No JWT → continue as guest
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id).select("-password");

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Invalid token
    return res.status(401).json({
      error: "Token invalid or expired",
    });
  }
};
