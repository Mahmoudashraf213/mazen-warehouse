import joi from "joi";
import { generalFields } from "../../middleware/vaildation.js";


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
  items: generalFields.returnItems.required(),
});