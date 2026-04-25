import { Product } from "../../../db/index.js";
import { ApiFeature } from "../../utils/apiFeatures.js";
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

// Update Product
export const updateProduct = async (req, res, next) => {
  const { productId } = req.params;
  const { name, description, unitPrice, unitsPerBox, retailPrice, stock } =
    req.body;

  // find product
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError(messages.product.notExist, 404));
  }

  // format name
  const formattedName = name ? name.trim().toLowerCase() : undefined;

  // check duplicate name
  if (formattedName && formattedName !== product.name) {
    const nameExists = await Product.findOne({ name: formattedName });
    if (nameExists) {
      return next(new AppError(messages.product.nameTaken, 409));
    }
  }

  // update fields
  product.name = formattedName ?? product.name;
  product.description = description ?? product.description;
  product.unitPrice = unitPrice ?? product.unitPrice;
  product.unitsPerBox = unitsPerBox ?? product.unitsPerBox;
  product.retailPrice = retailPrice ?? product.retailPrice;
  product.stock = stock ?? product.stock;

  // save
  const updatedProduct = await product.save();

  if (!updatedProduct) {
    return next(new AppError(messages.product.failToUpdate, 500));
  }

  // response
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