import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: true,
  },
  discountPrice: {
    type: Number,
    validate: {
      validator: function (value) {
        return value < this.price;
      },
      message: "Discount price should be less than original price",
    },
  },
  images: [
    {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
  ],
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  ratings: {
    type: Number,
    default: 0,
  },
});

export const Product = mongoose.model("product", productSchema);
