import joi from "joi";
import { generalFields } from "../../utils/generalFields.js";

// Add product schema
export const addProductSchema = joi.object({
  name: generalFields.name.required(),
  description: generalFields.description.optional(),
  unitPrice: generalFields.unitPrice.required(),
  unitsPerBox: generalFields.unitsPerBox.required(),
  retailPrice: generalFields.retailPrice.optional(),
  stock: generalFields.stock.optional(),
});

// Update product schema
export const updateProductSchema = joi.object({
  name: generalFields.name.optional(),
  description: generalFields.description.optional(),
  unitPrice: generalFields.unitPrice.optional(),
  unitsPerBox: generalFields.unitsPerBox.optional(),
  retailPrice: generalFields.retailPrice.optional(),
  stock: generalFields.stock.optional(),
  productId: generalFields.objectId.required(),
});


// Get product by id schema
export const getProductByIdSchema = joi.object({
  productId: generalFields.objectId.required(),
});

// Delete product schema
export const deleteProductSchema = joi.object({
  productId: generalFields.objectId.required(),
});