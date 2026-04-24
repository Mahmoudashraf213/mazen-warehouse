import { Product } from "../../../db/index.js";
import { AppError } from "../../utils/appError.js";
import { messages } from "../../utils/constant/messages.js";

// Add Product
export const addProduct = async (req, res, next) => {
  const { name, description, unitPrice, unitsPerBox, retailPrice, stock } =
    req.body;

  // format name
  const formattedName = name?.trim().toLowerCase();

  // check if product exists
  const productExist = await Product.findOne({ name: formattedName });

  if (productExist) {
    return next(new AppError(messages.product.alreadyExist, 409));
  }

  // create product
  const product = new Product({
    name: formattedName,
    description,
    unitPrice,
    unitsPerBox,
    retailPrice,
    stock,
  });

  // save product
  const createdProduct = await product.save();

  if (!createdProduct) {
    return next(new AppError(messages.product.failToCreate, 500));
  }

  // response
  return res.status(201).json({
    success: true,
    message: messages.product.created,
    data: createdProduct,
  });
};