import { Router } from "express";
import { isValid } from "../../middleware/vaildation.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { addCustomerSchema, deleteCustomerSchema, getCustomerByIdSchema, updateCustomerSchema } from "./customer.validation.js";
import { addCustomer, deleteCustomerById, getAllCustomers, getCustomerById, updateCustomer } from "./customer.controller.js";


const customerRouter = Router();


// add customer route
customerRouter.post("/add",
  isValid(addCustomerSchema),
  asyncHandler(addCustomer)
);

// update customer route
customerRouter.put("/update/:customerId",
  isValid(updateCustomerSchema),
  asyncHandler(updateCustomer)
);

// get all customers route
customerRouter.get("/",
  asyncHandler(getAllCustomers)
);

// get customer by id route
customerRouter.get("/:customerId",
  isValid(getCustomerByIdSchema),
  asyncHandler(getCustomerById)
);

// delete customer route
customerRouter.delete("/delete/:customerId",
  isValid(deleteCustomerSchema),
  asyncHandler(deleteCustomerById)
);

export default customerRouter;