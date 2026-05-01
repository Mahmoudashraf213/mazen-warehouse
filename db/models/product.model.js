import { model, Schema } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },

    description: {
      type: String,
      trim: true,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    unitsPerBox: {
      type: Number,
      required: true,
      min: 1,
    },

    boxPrice: {
      type: Number,
      min: 0,
    },

    retailPrice: {
      type: Number,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);



export const Product = model("Product", productSchema);