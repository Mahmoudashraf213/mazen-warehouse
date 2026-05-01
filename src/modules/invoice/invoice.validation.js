import joi from "joi";
import { generalFields } from "../../utils/generalFields.js";


// validation schema for creating an invoice
export const createInvoiceSchema = joi.object({
  customerId: generalFields.objectId.optional(),
  items: generalFields.items.required(),
  discount: generalFields.discount.optional(),
  paidAmount: generalFields.paidAmount.optional(),
  paymentMethod: generalFields.paymentMethod.required(),
});

// validation schema for updating an invoice
export const refundInvoiceSchema = joi.object({
  invoiceId: generalFields.objectId.required(),
  customerId: generalFields.objectId.optional(),
  items: generalFields.items.optional(),
  discount: generalFields.discount.optional(),
  paidAmount: generalFields.paidAmount.optional(),
  paymentMethod: generalFields.paymentMethod.optional(),
});

// validation schema for getting an invoice by ID
export const getInvoiceByIdSchema = joi.object({
  invoiceId: generalFields.objectId.required(),
  customerId: generalFields.objectId.optional(),
});

// default export for all validation schemas
export const deleteInvoiceByIdSchema = joi.object({
  invoiceId: generalFields.objectId.required(),
});