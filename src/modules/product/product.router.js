import { Router } from "express";
import { isValid } from "../../middleware/vaildation.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { addProductSchema, deleteProductSchema, getProductByIdSchema, updateProductSchema } from "./product.validation.js";
import { addProduct, deleteProductById, getAllProducts, getProductById, updateProduct } from "./product.controller.js";

const productRouter = Router();

// add product route
productRouter.post("/add",
  isValid(addProductSchema),
  asyncHandler(addProduct)
);

// update product route
productRouter.put("/update/:productId",
  isValid(updateProductSchema),
  asyncHandler(updateProduct)
);


// get all products route
productRouter.get("/",
  asyncHandler(getAllProducts)
);

// get product by id route
productRouter.get("/:productId",
  isValid(getProductByIdSchema),
  asyncHandler(getProductById)
);

// delete product route
productRouter.delete("/delete/:productId",
  isValid(deleteProductSchema),
  asyncHandler(deleteProductById)
);

export default productRouter;