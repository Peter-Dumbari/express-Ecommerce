import jwt from "jsonwebtoken";
import { User } from "../src/models/user.js";

const auth = async (req, res, next) => {
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

export default auth;
