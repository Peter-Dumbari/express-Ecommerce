import asyncHandler from "express-async-handler";
import { Category } from "../models/category.js";

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Check if category already exists
  const exist = await Category.findOne({ name });
  if (exist) {
    return res.status(400).json({ message: "Category already exists" });
  }

  const category = await Category.create({ name, description });
  res.status(201).json({
    category,
    success: true,
    message: "Category Created successfully",
  });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.status(200).json(categories);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const categoryId = req.params.id;

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  category.name = name || category.name;
  category.description = description || category.description;

  await category.save();
  res.status(200).json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  await category.deleteOne();

  res.status(200).json({ message: "Category deleted successfully" });
});
