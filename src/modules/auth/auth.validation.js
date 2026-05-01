import joi from "joi";
import { generalFields } from "../../utils/generalFields.js";

// Register schema
export const registerSchema = joi.object({
  name: generalFields.name.optional(),
  email: generalFields.email.optional(),
  phone: generalFields.phone.optional(),
  code: generalFields.code.required(),
  password: generalFields.password.required(),
});


// Login schema
export const loginSchema = joi.object({
  code: generalFields.code.required(),
  password: generalFields.password.required(),
});


// Update user schema
export const updateUserSchema = joi.object({
    name: generalFields.name.optional(),
    email: generalFields.email.optional(),
    phone: generalFields.phone.optional(),
    code: generalFields.code.optional(),
});