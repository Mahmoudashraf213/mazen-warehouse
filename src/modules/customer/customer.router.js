import { Router } from "express";
import { isValid } from "../../middleware/vaildation.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { addCustomerSchema, deleteCustomerSchema, getCustomerByIdSchema, updateCustomerSchema } from "./customer.validation.js";
import { addCustomer, deleteCustomerById, getAllCustomers, getCustomerById, updateCustomer } from "./customer.controller.js";
import { isAuthenticated } from "../../middleware/authentication.js";
import { isAuthorized } from "../../middleware/autheraization.js";
import { roles } from "../../utils/constant/enum.js";


const customerRouter = Router();


// add customer route
customerRouter.post("/add",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(addCustomerSchema),
  asyncHandler(addCustomer)
);

// update customer route
customerRouter.put("/update/:customerId",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(updateCustomerSchema),
  asyncHandler(updateCustomer)
);

// get all customers route
customerRouter.get("/",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  asyncHandler(getAllCustomers)
);

// get customer by id route
customerRouter.get("/:customerId",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(getCustomerByIdSchema),
  asyncHandler(getCustomerById)
);

// delete customer route
customerRouter.delete("/delete/:customerId",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(deleteCustomerSchema),
  asyncHandler(deleteCustomerById)
);

export default customerRouter;