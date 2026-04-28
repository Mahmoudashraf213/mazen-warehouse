import { Router } from "express";
import { isValid } from "../../middleware/vaildation.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { createInvoiceSchema, refundInvoiceSchema } from "./invoice.validation.js";
import { createInvoice, getAllInvoices, refundInvoice } from "./invoice.controller.js";


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
export default invoiceRouter;