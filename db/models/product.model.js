import { model, Schema } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
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

// before save
productSchema.pre("save", function (next) {
  if (this.unitPrice && this.unitsPerBox) {
    this.boxPrice = this.unitPrice * this.unitsPerBox;
  }
  next();
});

// before update
productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  const docToUpdate = await this.model.findOne(this.getQuery());

  const unitPrice =
    update.unitPrice !== undefined
      ? update.unitPrice
      : docToUpdate.unitPrice;

  const unitsPerBox =
    update.unitsPerBox !== undefined
      ? update.unitsPerBox
      : docToUpdate.unitsPerBox;

  update.boxPrice = unitPrice * unitsPerBox;

  next();
});

export const Product = model("Product", productSchema);