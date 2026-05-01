import { Router } from "express";
import { isValid } from "../../middleware/vaildation.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { createInvoiceSchema, deleteInvoiceByIdSchema, getInvoiceByIdSchema, refundInvoiceSchema } from "./invoice.validation.js";
import { createInvoice, deleteInvoiceById, generateInvoicePDF, getAllInvoices, getInvoiceById, updateInvoice } from "./invoice.controller.js";
import { isAuthenticated } from "../../middleware/authentication.js";
import { isAuthorized } from "../../middleware/autheraization.js";
import { roles } from "../../utils/constant/enum.js";


const invoiceRouter = Router();

// create invoice route
invoiceRouter.post("/create",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(createInvoiceSchema),
  asyncHandler(createInvoice)
);

// refund invoice route
invoiceRouter.put("/refund/:invoiceId",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(refundInvoiceSchema),
  asyncHandler(updateInvoice)
); 


// get all invoices route
invoiceRouter.get("/",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  asyncHandler(getAllInvoices)
);


// get invoice by id route
invoiceRouter.get(
  "/:invoiceId",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(getInvoiceByIdSchema),
  asyncHandler(getInvoiceById)
);

// delete invoice by id route
invoiceRouter.delete(
  "/delete/:invoiceId",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(deleteInvoiceByIdSchema),
  asyncHandler(deleteInvoiceById)
);

// generate invoice PDF route
invoiceRouter.get(
  "/pdf/:invoiceId",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  asyncHandler(generateInvoicePDF)
);
export default invoiceRouter;