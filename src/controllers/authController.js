import asyncHandler from "express-async-handler";
import { User } from "../models/user.js";
import generateToken from "../../utils/jwtToken.js";
import { generateEmailToken } from "../../utils/generateEmailToken.js";
import bcrypt from "bcrypt";
import axios from "axios";
import { sendMail } from "../../config/mailer.js";
import crypto from "crypto";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  const oldUser = await User.findOne({ email });
  if (oldUser) {
    return res
      .status(400)
      .json({ message: "Email already exists", status: "error" });
  }

  const oldPhone = await User.findOne({ phone });
  if (oldPhone)
    return res.status(400).json({ message: "Phone number already exists" });

  const { token, hashed } = generateEmailToken();

  const newUser = await User.create({
    name,
    email,
    phone,
    password,
    role,
    authProvider: "local",
    verificationToken: hashed,
    verificationTokenExpires: Date.now() + 15 * 60 * 1000,
  });

  const subject = "Account Verification";
  const verificationTemplate = "./templates/verify-email-template.html";
  const verifyURL = `${process.env.CLIENT_URL}/email-verification/${token}`;
  const placeholders = {
    customerName: newUser.name,
    verificationLink: verifyURL,
  };

  await sendMail(newUser.email, subject, placeholders, verificationTemplate);
  return res.status(201).json({
    message: "Registration done successfully",
    success: true,
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    verified: newUser.isVerified,
    role: newUser.role,
    phone: newUser.phone,
    token: generateToken(newUser._id),
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "Invalid email or password" });

  if (user.authProvider !== "local")
    return res.status(404).json({
      message: `This account is registered via ${user.authProvider}. Use that method.`,
    });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
    return res.status(404).json({ message: "Invalid email or password" });

  return res.status(200).json({
    message: "Login successful",
    success: true,
    _id: user._id,
    name: user.name,
    verified: user.isVerified,
    role: user.role,
    email: user.email,
    phone: user.phone,
    token: generateToken(user._id),
  });
});

// export const googeLogin = asyncHandler(async (req, res) => {
//   const { token } = req.body;
//   const googleUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`;

//   const googleRes = await axios.get(googleUrl);
//   console.log("googleRes", googleRes);
//   const { email, name, sub: googleId } = googleRes.data;
//   const user = await User.findOne({ email });
//   if (!user){
//    const newUser = await User.create({
//       name,
//       email,
//       googleId,
//       authProvider: "google",
//       isVerified: true,
//       password: googleId,
//     });

//   return res.status(200).json({
//     message: "Login successful",

//     _id: newUser._id,
//     name: newUser.name,
//     email: newUser.email,
//     token: generateToken(newUser._id),
//   });}
// });

export const googeLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const googleUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`;

  const googleRes = await axios.get(googleUrl);
  const { email, name, sub: googleId } = googleRes.data;

  let user = await User.findOne({ email });

  if (!user) {
    // Create new user
    user = await User.create({
      name,
      email,
      googleId,
      authProvider: "google",
      isVerified: true,
      password: googleId,
    });
  }

  // Always return response
  return res.status(200).json({
    message: "Login successful",
    success: true,
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json(users);
  } catch (error) {
    console.log("error", error);
    return res.status(500).json(error);
  }
});

export const facebookLogin = asyncHandler(async (req, res) => {
  const { accessToken, userID } = req.body;
  const fbUrl = `https://graph.facebook.com/${userID}?fields=id,name,email&access_token=${accessToken}`;
  const fbRes = await axios.get(fbUrl);

  const { email, name, id: facebookId } = fbRes.data;
  const user = await User.findOne({ email });
  if (!user)
    newUser = await User.create({
      name,
      email,
      facebookId,
      authProvider: "facebook",
      isVerified: true,
      password: facebookId,
    });

  return res.status(200).json({
    message: "Login successful",
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    token: generateToken(newUser._id),
  });
});

export const verifyUser = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() },
  });
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  // Mark as verified
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;

  await user.save();

  return res.status(200).json({
    message: "Email verified successfully. You can now login.",
    success: true,
  });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    const { token, hashed } = generateEmailToken();
    user.verificationToken = hashed;
    user.verificationTokenExpires = Date.now() + 15 * 60 * 1000; // 15 mins

    await user.save();

    // Prepare email
    const subject = "Account Verification";
    const verificationTemplate = "./templates/verify-email-template.html";
    const verifyURL = `${process.env.CLIENT_URL}/email-verification/${token}`;

    const placeholders = {
      customerName: user.name,
      verificationLink: verifyURL,
    };

    try {
      await sendMail(user.email, subject, placeholders, verificationTemplate);
    } catch (mailError) {
      console.error("Mail sending failed:", mailError);
      return res
        .status(500)
        .json({ message: "Failed to send verification email" });
    }

    return res.status(200).json({
      message: "Verification email resent successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in resendVerificationEmail:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const resetToken = crypto.randomBytes(20).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins

  await user.save({ validateBeforeSave: false });
  const resetURL = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;
  const mailTemplate = "./templates/forgot-password-template.html";
  const subject = "Password Reset Request";
  const placeholders = {
    customerName: user.name,
    resetPasswordLink: resetURL,
  };

  await sendMail(user.email, subject, placeholders, mailTemplate);

  res.json({ success: true, message: "Reset link sent to email" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  // ✅ HASH PASSWORD PROPERLY
  user.password = password;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.json({ success: true, message: "Password reset successful" });
});
