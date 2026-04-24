import { Router } from "express";
import { isValid } from "../../middleware/vaildation.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { addProductSchema } from "./product.validation.js";
import { addProduct } from "./product.controller.js";

const productRouter = Router();

// add product route
productRouter.post("/add",
  isValid(addProductSchema),
  asyncHandler(addProduct)
);

export default productRouter;