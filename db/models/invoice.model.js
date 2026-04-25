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
  },
  { timestamps: true }
);

// calculations
invoiceSchema.pre("save", function (next) {
  let subTotal = 0;

  this.items.forEach((item) => {
    item.totalPrice = item.quantity * item.unitPrice;
    subTotal += item.totalPrice;
  });

  this.subTotal = subTotal;
  this.totalAmount = subTotal - this.discount;
  this.dueAmount = this.totalAmount - this.paidAmount;

  if (this.dueAmount <= 0) {
    this.status = invoiceStatus.PAID;
  } else if (this.paidAmount > 0) {
    this.status = invoiceStatus.PARTIAL;
  } else {
    this.status = invoiceStatus.UNPAID;
  }

  next();
});

export const Invoice = model("Invoice", invoiceSchema);