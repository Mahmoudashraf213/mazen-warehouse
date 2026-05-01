import puppeteer from "puppeteer";
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

  // apply calculations (بدل pre save)
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
  }

  // re-apply calculations after refund
  applyInvoiceCalculations(invoice);

  // adjust customer balance
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
    .populate("items.productId"); // لو عايز المنتجات بس

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

// Generate PDF
export const generateInvoicePDF = async (req, res, next) => {
  const { invoiceId } = req.params;

  const invoice = await Invoice.findById(invoiceId)
    .populate("items.productId");

  if (!invoice) {
    return next(new AppError("Invoice not found", 404));
  }

  const html = `
  <html>
  <head>
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

      .info {
        margin-bottom: 20px;
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

      .totals p {
        margin: 5px 0;
        font-size: 15px;
      }

      .seller {
        border: 1px solid #ddd;
        padding: 12px;
        margin-top: 30px;
        background: #f9f9f9;
        border-radius: 5px;
      }

      .footer {
        margin-top: 20px;
        text-align: center;
        font-size: 12px;
        color: #888;
      }
    </style>
  </head>

  <body>

    <!-- Header -->
    <div class="header">
      <h1>INVOICE</h1>
      <p>Invoice Management System</p>
    </div>

    <!-- Invoice Info -->
    <div class="info">
      <p><strong>Invoice ID:</strong> ${invoice._id}</p>
      <p><strong>Customer:</strong> ${invoice.customerId?.name || "N/A"}</p>
      <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
      <p><strong>Status:</strong> ${invoice.status}</p>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Quantity</th>
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
            <td>${item.quantity * item.unitPrice}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <p><strong>Subtotal:</strong> ${invoice.subTotal || 0}</p>
      <p><strong>Discount:</strong> ${invoice.discount || 0}</p>
      <p><strong>Total:</strong> ${invoice.totalAmount || 0}</p>
      <p><strong>Paid:</strong> ${invoice.paidAmount || 0}</p>
      <p><strong>Due:</strong> ${invoice.dueAmount || 0}</p>
    </div>

    <!-- Seller Section (NOW AT BOTTOM) -->
    <div class="seller">
      <p><strong>Seller Name:</strong> ماذن رجب محمد</p>
      <p><strong>Phone 1:</strong> 01025210536</p>
      <p><strong>Phone 2:</strong> 01158325071</p>
    </div>

    <!-- Footer -->
    <div class="footer">
      Thank you for your business 🙏
    </div>

  </body>
  </html>
  `;

  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();

  await page.setContent(html);

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename=invoice-${invoiceId}.pdf`,
  });

  res.send(pdf);
};