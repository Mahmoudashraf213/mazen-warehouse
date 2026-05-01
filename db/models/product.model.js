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

    // unit price
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // units per box
    unitsPerBox: {
      type: Number,
      required: true,
      min: 1,
    },

    // stock quantity
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // box price
    boxPrice: {
      type: Number,
      min: 0,
    },

    // total units
    totalUnits: {
      type: Number,
      min: 0,
    },

    retailPrice: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Product = model("Product",productSchema);