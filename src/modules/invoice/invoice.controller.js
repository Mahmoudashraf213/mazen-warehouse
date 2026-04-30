import puppeteer from "puppeteer";
import { Invoice, Product, Customer } from "../../../db/index.js";
import { AppError } from "../../utils/appError.js";
import { messages } from "../../utils/constant/messages.js";
import { paymentMethods } from "../../utils/constant/enum.js";

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

  let subTotal = 0;
  const updatedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) {
      return next(new AppError(messages.product.notExist, 404));
    }

    if (product.stock < item.quantity) {
      return next(new AppError(messages.product.outOfStock, 400));
    }

    const itemTotal = item.quantity * item.unitPrice;

    subTotal += itemTotal;

    updatedItems.push({
      productId: product._id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: itemTotal,
    });

    product.stock -= item.quantity;
    await product.save();
  }

  const totalAmount = subTotal - discount;
  const dueAmount = totalAmount - paidAmount;

  if (
    paymentMethod === paymentMethods.CREDIT &&
    customer &&
    customer.allowCredit
  ) {
    customer.balance += dueAmount;
    await customer.save();
  }

  const invoice = new Invoice({
    customerId,
    items: updatedItems,
    subTotal,
    discount,
    totalAmount,
    paidAmount,
    dueAmount,
    paymentMethod,
  });

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

// Refund / Return
export const refundInvoice = async (req, res, next) => {
  const { invoiceId } = req.params;
  const { items } = req.body;

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    return next(new AppError(messages.invoice.notExist, 404));
  }

  let refundAmount = 0;

  for (const returnItem of items) {
    const invoiceItem = invoice.items.find(
      (i) => i.productId.toString() === returnItem.productId
    );

    if (!invoiceItem) {
      return next(new AppError(messages.invoice.itemNotFound, 404));
    }

    if (returnItem.quantity > invoiceItem.quantity) {
      return next(new AppError(messages.invoice.invalidQuantity, 400));
    }

    const product = await Product.findById(returnItem.productId);

    if (!product) {
      return next(new AppError(messages.product.notExist, 404));
    }

    const itemRefund = returnItem.quantity * invoiceItem.unitPrice;
    refundAmount += itemRefund;

    product.stock += returnItem.quantity;
    await product.save();

    invoiceItem.quantity -= returnItem.quantity;
    invoiceItem.total =
      invoiceItem.quantity * invoiceItem.unitPrice;
  }

  invoice.subTotal -= refundAmount;
  invoice.totalAmount -= refundAmount;

  if (invoice.customerId) {
    const customer = await Customer.findById(invoice.customerId);

    if (customer) {
      customer.balance -= refundAmount;
      await customer.save();
    }
  }

  const updatedInvoice = await invoice.save();

  return res.status(200).json({
    success: true,
    message: messages.invoice.refunded,
    refundAmount,
    data: updatedInvoice,
  });
};

// Get All Invoices
export const getAllInvoices = async (req, res, next) => {
  const { customerId, paymentMethod, status } = req.query;

  const filter = {};

  if (customerId) {
    filter.customerId = customerId;
  }

  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  if (status) {
    filter.status = status;
  }

  const apiFeature = new ApiFeature(Invoice.find(filter), req.query)
    .pagination()
    .sort()
    .select();

  const invoices = await apiFeature.mongooseQuery.populate("customerId");

  if (!invoices || invoices.length === 0) {
    let noMatchMessage = messages.invoice.failToFetch;

    if (customerId) {
      noMatchMessage = messages.invoice.noCustomerMatch;
    } else if (paymentMethod) {
      noMatchMessage = messages.invoice.noPaymentMatch;
    } else if (status) {
      noMatchMessage = messages.invoice.noStatusMatch;
    }

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
    .populate("customerId")
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


// Delete Invoice By Id
export const deleteInvoiceById = async (req, res, next) => {
  const { invoiceId } = req.params;

  if (!invoiceId) {
    return next(new AppError(messages.invoice.notExist, 400));
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    return next(new AppError(messages.invoice.notExist, 404));
  }

  // restore stock
  for (const item of invoice.items) {
    const product = await Product.findById(item.productId);

    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  // adjust customer balance
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

// Generate Invoice PDF
export const generateInvoicePDF = async (req, res, next) => {
  const { invoiceId } = req.params;

  const invoice = await Invoice.findById(invoiceId)
    .populate("customerId")
    .populate("items.productId");

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  const html = `
    <h1>Invoice</h1>
    <p>Customer: ${invoice.customerId?.name || "N/A"}</p>
    <p>Total: ${invoice.totalAmount}</p>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html);

  const pdf = await page.pdf({ format: "A4" });

  await browser.close();

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=invoice.pdf",
  });

  res.send(pdf);
};