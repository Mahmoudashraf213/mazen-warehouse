import { Router } from "express";
import { isValid } from "../../middleware/vaildation.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { addProduct, deleteProductById, getAllProducts, getProductById, updateProduct } from "./product.controller.js";
import { addProductSchema, deleteProductSchema, getProductByIdSchema, updateProductSchema } from "./product.validation.js";
import { isAuthenticated } from "../../middleware/authentication.js";
import { isAuthorized } from "../../middleware/autheraization.js";
import { roles } from "../../utils/constant/enum.js";

const productRouter = Router();

// add product route
productRouter.post("/add",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(addProductSchema),
  asyncHandler(addProduct)
);

// update product route
productRouter.put("/update/:productId",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(updateProductSchema),
  asyncHandler(updateProduct)
);


// get all products route
productRouter.get("/",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  asyncHandler(getAllProducts)
);

// get product by id route
productRouter.get("/:productId",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(getProductByIdSchema),
  asyncHandler(getProductById)
);

// delete product route
productRouter.delete("/delete/:productId",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  isValid(deleteProductSchema),
  asyncHandler(deleteProductById)
);

export default productRouter;