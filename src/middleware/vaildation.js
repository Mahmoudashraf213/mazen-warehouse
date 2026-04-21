import joi from "joi";
import { AppError } from "../utils/appError.js";
import { invoiceStatus, paymentMethods } from "../utils/constant/enum.js";

export const generalFields = {
  objectId: joi.string().hex().length(24),
  name: joi.string().trim(),
  email: joi.string().email(),
  phone: joi.string().trim(),
  number: joi.number(),
  price: joi.number().min(0),
  boolean: joi.boolean(),
  description: joi.string().trim(),
  unitPrice: joi.number().min(0),
  unitsPerBox: joi.number().min(1),
  stock: joi.number().min(0),
  retailPrice: joi.number().min(0),
  secondPhone: joi.string().trim(),
  companyName: joi.string().trim(),
  address: joi.string().trim(),
  notes: joi.string().trim(),
  quantity: joi.number().min(1),
  discount: joi.number().min(0),
  paidAmount: joi.number().min(0),
  paymentMethod: joi.string().valid(...Object.values(paymentMethods)),
  status: joi.string().valid(...Object.values(invoiceStatus)),
  items: joi.array().items(
    joi.object({
      productId: joi.string().hex().length(24).required(),
      quantity: joi.number().min(1).required(),
      unitPrice: joi.number().min(0).required(),
    })
  ),
};

export const isValid = (schema) => {
  return (req, res, next) => {
    let data = { ...req.body, ...req.params, ...req.query };
    const { error } = schema.validate(data, { abortEarly: false });
    if (error) {
      const errorMessage = error.details.map((d) => d.message).join(", ");
      return next(new AppError(errorMessage, 400));
    }
    next();
  };
};