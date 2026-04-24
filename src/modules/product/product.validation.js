import joi from "joi";
import { generalFields } from "../../middleware/vaildation.js";

// Add product schema
export const addProductSchema = joi.object({
  name: generalFields.name.required(),
  description: generalFields.description.optional(),
  unitPrice: generalFields.unitPrice.required(),
  unitsPerBox: generalFields.unitsPerBox.required(),
  retailPrice: generalFields.retailPrice.optional(),
  stock: generalFields.stock.optional(),
});
