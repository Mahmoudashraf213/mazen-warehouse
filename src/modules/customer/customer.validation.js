import joi from "joi";
import { generalFields } from "../../utils/generalFields.js";


// Add customer schema
export const addCustomerSchema = joi.object({
  name: generalFields.name.required(),
  phone: generalFields.phone.required(),
  secondPhone: generalFields.secondPhone.optional(),
  email: generalFields.email.optional(),
  companyName: generalFields.companyName.optional(),
  address: generalFields.address.optional(),
  creditLimit: generalFields.number.optional(),
  allowCredit: generalFields.boolean.optional(),
  notes: generalFields.notes.optional(),
});

// update customer schema
export const updateCustomerSchema = joi.object({
  name: generalFields.name.optional(),
  phone: generalFields.phone.optional(),
  secondPhone: generalFields.secondPhone.optional(),
  email: generalFields.email.optional(),
  companyName: generalFields.companyName.optional(),
  address: generalFields.address.optional(),
  creditLimit: generalFields.number.optional(),
  allowCredit: generalFields.boolean.optional(),
  isActive: generalFields.boolean.optional(),
  notes: generalFields.notes.optional(),
  customerId: generalFields.objectId.required(),
});

// get customer by id schema
export const getCustomerByIdSchema = joi.object({
  customerId: generalFields.objectId.required(),
});

// delete customer schema
export const deleteCustomerSchema = joi.object({
  customerId: generalFields.objectId.required(),
})