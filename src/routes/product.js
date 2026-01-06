import express from "express";
import {
  addProductReview,
  createProduct,
  deleteProduct,
  deleteProductReview,
  getAllProducts,
  getProductByCategory,
  getProductById,
  productUpdate,
} from "../controllers/productController.js";
import auth from "../../middleware/auth.js";
import isAdminOnly from "../../middleware/isAdmin.js";
import uploadImage from "../../config/multer.js";

const router = express.Router();

router.post(
  "/",
  auth,
  isAdminOnly,
  uploadImage.array("images", 10),
  createProduct
);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.get("/:id/category", getProductByCategory);
router.put("/:id", auth, isAdminOnly, productUpdate);
router.delete("/:id", auth, isAdminOnly, deleteProduct);
router.post("/:id/review", auth, addProductReview);
router.delete("/:id/review", auth, deleteProductReview);

export default router;
