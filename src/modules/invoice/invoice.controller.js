import puppeteer from "puppeteer";
import mongoose from "mongoose";
import chromium from "@sparticuz/chromium";
import { Invoice, Product, Customer } from "../../../db/index.js";
import { ApiFeature } from "../../utils/apiFeatures.js";
import { AppError } from "../../utils/appError.js";
import { messages } from "../../utils/constant/messages.js";
import { paymentMethods, invoiceStatus } from "../../utils/constant/enum.js";

// helper: apply invoice calculations
const applyInvoiceCalculations = (invoice) => {
  let subTotal = 0;

  invoice.items.forEach((item) => {
    item.totalPrice = item.quantity * item.unitPrice;
    subTotal += item.totalPrice;
  });

  invoice.subTotal = subTotal;
  invoice.totalAmount = subTotal - (invoice.discount || 0);
  invoice.dueAmount = invoice.totalAmount - (invoice.paidAmount || 0);

  if (invoice.dueAmount <= 0) {
    invoice.status = invoiceStatus.PAID;
  } else if (invoice.paidAmount > 0) {
    invoice.status = invoiceStatus.PARTIAL;
  } else {
    invoice.status = invoiceStatus.UNPAID;
  }
};

// Create Invoice
export const createInvoice = async (req, res, next) => {
  const { customerId, items, discount = 0, paidAmount = 0, paymentMethod } =
    req.body;

  let customer = null;

  if (customerId) {
    customer = await Customer.findById(customerId);
    if (!customer) {
      return next(new AppError(messages.customer.notExist, 404));
    }
  }

  const updatedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) {
      return next(new AppError(messages.product.notExist, 404));
    }

    if (product.stock < item.quantity) {
      return next(new AppError(messages.product.outOfStock, 400));
    }

    updatedItems.push({
      productId: product._id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: 0,
    });

    product.stock -= item.quantity;
    await product.save();
  }

  const invoice = new Invoice({
    customerId,
    items: updatedItems,
    discount,
    paidAmount,
    paymentMethod,
  });

  // apply calculations 
  applyInvoiceCalculations(invoice);

  // credit logic
  if (
    paymentMethod === paymentMethods.CREDIT &&
    customer &&
    customer.allowCredit
  ) {
    customer.balance += invoice.dueAmount;
    await customer.save();
  }

  const createdInvoice = await invoice.save();

  if (!createdInvoice) {
    return next(new AppError(messages.invoice.failToCreate, 500));
  }

  return res.status(201).json({
    success: true,
    message: messages.invoice.created,
    data: createdInvoice,
  });
};

// Update Invoice
export const updateInvoice = async (req, res, next) => {
  const { invoiceId } = req.params;
  const { items, discount, paidAmount, paymentMethod } = req.body;

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    return next(new AppError(messages.invoice.notExist, 404));
  }

  if (items?.length) {
    for (const updatedItem of items) {
      const oldItem = invoice.items.find(
        (item) => item.productId.toString() === updatedItem.productId
      );

      if (!oldItem) {
        return next(new AppError(messages.invoice.itemNotFound, 404));
      }

      const product = await Product.findById(updatedItem.productId);

      if (!product) {
        return next(new AppError(messages.product.notExist, 404));
      }

      const oldQuantity = oldItem.quantity;
      const newQuantity = updatedItem.quantity;
      const difference = newQuantity - oldQuantity;

      if (difference > 0 && product.stock < difference) {
        return next(new AppError(messages.product.outOfStock, 400));
      }

      product.stock -= difference;
      product.totalUnits = product.stock * product.unitsPerBox;
      await product.save();

      oldItem.quantity = newQuantity;
      oldItem.unitPrice = updatedItem.unitPrice;
      oldItem.totalPrice = newQuantity * updatedItem.unitPrice;
    }
  }

  if (discount !== undefined) {
    invoice.discount = discount;
  }

  if (paidAmount !== undefined) {
    invoice.paidAmount = paidAmount;
  }

  if (paymentMethod) {
    invoice.paymentMethod = paymentMethod;
  }

  applyInvoiceCalculations(invoice);

  const updatedInvoice = await invoice.save();

  return res.status(200).json({
    success: true,
    message: messages.invoice.updated,
    data: updatedInvoice,
  });

};

// Get All Invoices
export const getAllInvoices = async (req, res, next) => {
  const { paymentMethod, status } = req.query;

  const filter = {};

  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (status) filter.status = status;

  const apiFeature = new ApiFeature(Invoice.find(filter), req.query)
    .pagination()
    .sort()
    .select();

  const invoices = await apiFeature.mongooseQuery
    .populate("items.productId") 
    .populate("customerId");

  if (!invoices || invoices.length === 0) {
    let noMatchMessage = messages.invoice.failToFetch;

    if (paymentMethod) noMatchMessage = messages.invoice.noPaymentMatch;
    else if (status) noMatchMessage = messages.invoice.noStatusMatch;

    return next(new AppError(noMatchMessage, 404));
  }

  return res.status(200).json({
    success: true,
    message: messages.invoice.fetchedSuccessfully,
    count: invoices.length,
    data: invoices,
  });
};

// Get Invoice By Id
export const getInvoiceById = async (req, res, next) => {
  const { invoiceId } = req.params;

  const invoice = await Invoice.findById(invoiceId)
    .populate("customerId", "name phone email")
    .populate("items.productId");

  if (!invoice) {
    return next(new AppError(messages.invoice.notExist, 404));
  }

  return res.status(200).json({
    success: true,
    message: messages.invoice.fetchedSuccessfully,
    data: invoice,
  });
};

// Delete Invoice
export const deleteInvoiceById = async (req, res, next) => {
  const { invoiceId } = req.params;

  if (!invoiceId) {
    return next(new AppError(messages.invoice.notExist, 400));
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    return next(new AppError(messages.invoice.notExist, 404));
  }

  for (const item of invoice.items) {
    const product = await Product.findById(item.productId);

    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  if (invoice.customerId && invoice.dueAmount > 0) {
    const customer = await Customer.findById(invoice.customerId);

    if (customer) {
      customer.balance -= invoice.dueAmount;
      await customer.save();
    }
  }

  await invoice.deleteOne();

  return res.status(200).json({
    success: true,
    message: messages.invoice.deleted,
  });
};

export const getInvoicePrintHTML = async (req, res, next) => {
  const { invoiceId } = req.params;

  const invoice = await Invoice.findById(invoiceId)
    .populate("customerId")
    .populate("items.productId");

  if (!invoice) {
    return next(new AppError(messages.invoice.notExist, 404));
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial;
        padding: 30px;
        color: #333;
      }

      .header {
        text-align: center;
        margin-bottom: 20px;
      }

      .header h1 {
        margin: 0;
        color: #2c3e50;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }

      table, th, td {
        border: 1px solid #ddd;
      }

      th, td {
        padding: 10px;
        text-align: center;
      }

      th {
        background: #f4f4f4;
      }

      .totals {
        margin-top: 20px;
        text-align: right;
      }

      .seller {
        margin-top: 30px;
        padding: 15px;
        background: #f9f9f9;
        border: 1px solid #ddd;
      }

      @media print {
        button { display: none; }
      }
    </style>
  </head>

  <body>

    <div class="header">
      <h1>INVOICE</h1>
    </div>

    <p><strong>Customer:</strong> ${invoice.customerId?.name || "N/A"}</p>
    <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>

      <tbody>
        ${invoice.items
          .map(
            (item) => `
          <tr>
            <td>${item.productId?.name || "N/A"}</td>
            <td>${item.quantity}</td>
            <td>${item.unitPrice}</td>
            <td>${item.totalPrice}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals">
      <p><strong>Subtotal:</strong> ${invoice.subTotal}</p>
      <p><strong>Discount:</strong> ${invoice.discount}</p>
      <p><strong>Total:</strong> ${invoice.totalAmount}</p>
      <p><strong>Paid:</strong> ${invoice.paidAmount}</p>
      <p><strong>Due:</strong> ${invoice.dueAmount}</p>
    </div>

    <div class="seller">
      <p><strong>Seller:</strong> ماذن رجب محمد</p>
      <p>📞 01025210536</p>
      <p>📞 01158325071</p>
    </div>

    <button onclick="window.print()" style="margin-top:20px;padding:10px">
      Print Invoice
    </button>

  </body>
  </html>
  `;

  return res.send(html);
};
// Get Customer Invoices Details
export const getCustomerInvoicesDetails = async (
  req,
  res,
  next
) => {
  const { customerId } = req.params;

  const data = await Invoice.aggregate([
    {
      $match: {
        customerId: new mongoose.Types.ObjectId(
          customerId
        ),
      },
    },

    {
      $lookup: {
        from: "customers",
        localField: "customerId",
        foreignField: "_id",
        as: "customer",
      },
    },

    {
      $unwind: "$customer",
    },

    {
      $group: {
        _id: "$customerId",

        customerName: {
          $first: "$customer.name",
        },

        customerPhone: {
          $first: "$customer.phone",
        },

        totalInvoices: {
          $sum: 1,
        },

        totalAmount: {
          $sum: "$totalAmount",
        },

        totalPaid: {
          $sum: "$paidAmount",
        },

        totalDue: {
          $sum: "$dueAmount",
        },

        invoices: {
          $push: {
            invoiceId: "$_id",
            status: "$status",
            paymentMethod: "$paymentMethod",
            subTotal: "$subTotal",
            discount: "$discount",
            totalAmount: "$totalAmount",
            paidAmount: "$paidAmount",
            dueAmount: "$dueAmount",
            createdAt: "$createdAt",
            items: "$items",
          },
        },
      },
    },
  ]);

  if (!data.length) {
    return next(new AppError(messages.invoice.noCustomerMatch, 404));
  }

  return res.status(200).json({
    success: true,
    message: messages.invoice.fetchedSuccessfully,
    data: data[0],
  });
};