import { Router } from "express";
import { isValid } from "../../middleware/vaildation.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { createInvoiceSchema, deleteInvoiceByIdSchema, getInvoiceByIdSchema, refundInvoiceSchema } from "./invoice.validation.js";
import { createInvoice, deleteInvoiceById, generateInvoicePDF, getAllInvoices, getInvoiceById, refundInvoice } from "./invoice.controller.js";


const invoiceRouter = Router();

// create invoice route
invoiceRouter.post("/create",
  isValid(createInvoiceSchema),
  asyncHandler(createInvoice)
);

// refund invoice route
invoiceRouter.put("/refund/:invoiceId",
  isValid(refundInvoiceSchema),
  asyncHandler(refundInvoice)
); 


// get all invoices route
invoiceRouter.get("/",
  asyncHandler(getAllInvoices)
);


// get invoice by id route
invoiceRouter.get(
  "/:invoiceId",
  isValid(getInvoiceByIdSchema),
  asyncHandler(getInvoiceById)
);

// delete invoice by id route
invoiceRouter.delete(
  "/delete/:invoiceId",
  isValid(deleteInvoiceByIdSchema),
  asyncHandler(deleteInvoiceById)
);

// generate invoice PDF route
invoiceRouter.get(
  "/pdf/:invoiceId",
  asyncHandler(generateInvoicePDF)
);
export default invoiceRouter;