import express from "express";
import isAdminOnly from "../../middleware/isAdmin.js";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

router.post("/create", auth, isAdminOnly, createCategory);
router.get("/", getCategories);
router.put("/:id/update", auth, isAdminOnly, updateCategory);
router.delete("/:id/delete", auth, isAdminOnly, deleteCategory);

export default router;
