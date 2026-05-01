import { model, Schema } from "mongoose";
import { invoiceStatus, paymentMethods } from "../../src/utils/constant/enum.js";

const invoiceItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const invoiceSchema = new Schema(
  {
    items: [invoiceItemSchema],

    subTotal: {
      type: Number,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    dueAmount: {
      type: Number,
      min: 0,
    },

    status: {
      type: String,
      enum: Object.values(invoiceStatus),
      default: invoiceStatus.UNPAID,
    },

    paymentMethod: {
      type: String,
      enum: Object.values(paymentMethods),
      default: paymentMethods.CASH,
    },
    customerId: {
  type: Schema.Types.ObjectId,
  ref: "Customer",
}
  },
  { timestamps: true }
);



export const Invoice = model("Invoice", invoiceSchema);