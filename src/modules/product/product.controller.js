import { Product } from "../../../db/index.js";
import { ApiFeature } from "../../utils/apiFeatures.js";
import { AppError } from "../../utils/appError.js";
import { messages } from "../../utils/constant/messages.js";

// Add Product
export const addProduct = async (req, res, next) => {
  const { name, description, unitPrice, unitsPerBox, retailPrice, stock } =
    req.body;

  const formattedName = name?.trim().toLowerCase();

  const productExist = await Product.findOne({ name: formattedName });

  if (productExist) {
    return next(new AppError(messages.product.alreadyExist, 409));
  }

  // calculate boxPrice
  const boxPrice =
    unitPrice && unitsPerBox ? unitPrice * unitsPerBox : undefined;

  const product = new Product({
    name: formattedName,
    description,
    unitPrice,
    unitsPerBox,
    boxPrice,
    retailPrice,
    stock,
  });

  const createdProduct = await product.save();

  if (!createdProduct) {
    return next(new AppError(messages.product.failToCreate, 500));
  }

  return res.status(201).json({
    success: true,
    message: messages.product.created,
    data: createdProduct,
  });
};

// Update Product
export const updateProduct = async (req, res, next) => {
  const { productId } = req.params;
  const { name, description, unitPrice, unitsPerBox, retailPrice, stock } =
    req.body;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new AppError(messages.product.notExist, 404));
  }

  const formattedName = name ? name.trim().toLowerCase() : undefined;

  if (formattedName && formattedName !== product.name) {
    const nameExists = await Product.findOne({ name: formattedName });
    if (nameExists) {
      return next(new AppError(messages.product.nameTaken, 409));
    }
  }

  // get final values (old or new)
  const finalUnitPrice =
    unitPrice !== undefined ? unitPrice : product.unitPrice;

  const finalUnitsPerBox =
    unitsPerBox !== undefined ? unitsPerBox : product.unitsPerBox;

  // calculate boxPrice
  const boxPrice = finalUnitPrice * finalUnitsPerBox;

  // update fields
  product.name = formattedName ?? product.name;
  product.description = description ?? product.description;
  product.unitPrice = finalUnitPrice;
  product.unitsPerBox = finalUnitsPerBox;
  product.boxPrice = boxPrice;
  product.retailPrice = retailPrice ?? product.retailPrice;
  product.stock = stock ?? product.stock;

  const updatedProduct = await product.save();

  if (!updatedProduct) {
    return next(new AppError(messages.product.failToUpdate, 500));
  }

  return res.status(200).json({
    success: true,
    message: messages.product.updated,
    data: updatedProduct,
  });
};

// Get All Products
export const getAllProducts = async (req, res, next) => {
  const { name, minPrice, maxPrice } = req.query;

  const filter = {};

  if (name) {
    filter.name = { $regex: name, $options: "i" };
  }

  if (minPrice || maxPrice) {
    filter.unitPrice = {};
    if (minPrice) filter.unitPrice.$gte = Number(minPrice);
    if (maxPrice) filter.unitPrice.$lte = Number(maxPrice);
  }

  const apiFeature = new ApiFeature(Product.find(filter), req.query)
    .pagination()
    .sort()
    .select();

  const products = await apiFeature.mongooseQuery;

  if (!products || products.length === 0) {
    let noMatchMessage = messages.product.failToFetch;

    if (name) {
      noMatchMessage = messages.product.noNameMatch(name);
    } else if (minPrice || maxPrice) {
      noMatchMessage = messages.product.noPriceMatch;
    }

    return next(new AppError(noMatchMessage, 404));
  }

  return res.status(200).json({
    success: true,
    message: messages.product.fetchedSuccessfully,
    count: products.length,
    data: products,
  });
};

// Get Product By Id
export const getProductById = async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new AppError(messages.product.notExist, 404));
  }

  return res.status(200).json({
    success: true,
    message: messages.product.fetchedSuccessfully,
    data: product,
  });
};

// Delete Product By Id
export const deleteProductById = async (req, res, next) => {
  const { productId } = req.params;

  if (!productId) {
    return next(new AppError(messages.product.notExist, 400));
  }

  const product = await Product.findById(productId);

  if (!product) {
    return next(new AppError(messages.product.notExist, 404));
  }

  await product.deleteOne();

  return res.status(200).json({
    success: true,
    message: messages.product.deleted,
  });
};