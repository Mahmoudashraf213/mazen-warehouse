import { Customer } from "../../../db/index.js";
import { ApiFeature } from "../../utils/apiFeatures.js";
import { AppError } from "../../utils/appError.js";
import { messages } from "../../utils/constant/messages.js";

// Add Customer
export const addCustomer = async (req, res, next) => {
  const {
    name,
    phone,
    secondPhone,
    email,
    companyName,
    address,
    creditLimit,
    allowCredit,
    notes,
  } = req.body;

  const formattedName = name?.trim().toLowerCase();

  const customerExist = await Customer.findOne({
    $or: [{ phone }, { email }],
  });

  if (customerExist) {
    return next(new AppError(messages.customer.alreadyExist, 409));
  }

  // default balance = 0
  const balance = 0;

  // determine isActive
  let isActive = true;

  if (balance > creditLimit && creditLimit > 0) {
    isActive = false;
  }

  const customer = new Customer({
    name: formattedName,
    phone,
    secondPhone,
    email,
    companyName,
    address,
    creditLimit,
    allowCredit,
    notes,
    balance,
    isActive,
  });

  const createdCustomer = await customer.save();

  if (!createdCustomer) {
    return next(new AppError(messages.customer.failToCreate, 500));
  }

  return res.status(201).json({
    success: true,
    message: messages.customer.created,
    data: createdCustomer,
  });
};

// Update Customer
export const updateCustomer = async (req, res, next) => {
  const { customerId } = req.params;
  const {
    name,
    phone,
    secondPhone,
    email,
    companyName,
    address,
    creditLimit,
    allowCredit,
    isActive,
    notes,
  } = req.body;

  const customer = await Customer.findById(customerId);

  if (!customer) {
    return next(new AppError(messages.customer.notExist, 404));
  }

  const formattedName = name ? name.trim().toLowerCase() : undefined;

  if (phone && phone !== customer.phone) {
    const phoneExist = await Customer.findOne({ phone });
    if (phoneExist) {
      return next(new AppError(messages.customer.phoneTaken, 409));
    }
  }

  if (email && email !== customer.email) {
    const emailExist = await Customer.findOne({ email });
    if (emailExist) {
      return next(new AppError(messages.customer.emailTaken, 409));
    }
  }

  // update values first
  const finalCreditLimit =
    creditLimit !== undefined ? creditLimit : customer.creditLimit;

  const finalBalance = customer.balance;

  // determine isActive automatically
  let finalIsActive =
    isActive !== undefined ? isActive : customer.isActive;

  if (finalBalance > finalCreditLimit && finalCreditLimit > 0) {
    finalIsActive = false;
  }

  customer.name = formattedName ?? customer.name;
  customer.phone = phone ?? customer.phone;
  customer.secondPhone = secondPhone ?? customer.secondPhone;
  customer.email = email ?? customer.email;
  customer.companyName = companyName ?? customer.companyName;
  customer.address = address ?? customer.address;
  customer.creditLimit = finalCreditLimit;
  customer.allowCredit = allowCredit ?? customer.allowCredit;
  customer.isActive = finalIsActive;
  customer.notes = notes ?? customer.notes;

  const updatedCustomer = await customer.save();

  if (!updatedCustomer) {
    return next(new AppError(messages.customer.failToUpdate, 500));
  }

  return res.status(200).json({
    success: true,
    message: messages.customer.updated,
    data: updatedCustomer,
  });
};

// Get All Customers
export const getAllCustomers = async (req, res, next) => {
  const { name, phone, companyName } = req.query;

  const filter = {};

  if (name) {
    filter.name = { $regex: name, $options: "i" };
  }

  if (phone) {
    filter.phone = { $regex: phone, $options: "i" };
  }

  if (companyName) {
    filter.companyName = { $regex: companyName, $options: "i" };
  }

  const apiFeature = new ApiFeature(Customer.find(filter), req.query)
    .pagination()
    .sort()
    .select();

  const customers = await apiFeature.mongooseQuery;

  if (!customers || customers.length === 0) {
    let noMatchMessage = messages.customer.failToFetch;

    if (name) {
      noMatchMessage = messages.customer.noNameMatch(name);
    } else if (phone) {
      noMatchMessage = messages.customer.noPhoneMatch(phone);
    } else if (companyName) {
      noMatchMessage = messages.customer.noCompanyMatch(companyName);
    }

    return next(new AppError(noMatchMessage, 404));
  }

  return res.status(200).json({
    success: true,
    message: messages.customer.fetchedSuccessfully,
    count: customers.length,
    data: customers,
  });
};

// Get Customer By Id
export const getCustomerById = async (req, res, next) => {
  const { customerId } = req.params;

  const customer = await Customer.findById(customerId);

  if (!customer) {
    return next(new AppError(messages.customer.notExist, 404));
  }

  return res.status(200).json({
    success: true,
    message: messages.customer.fetchedSuccessfully,
    data: customer,
  });
};

// Delete Customer By Id
export const deleteCustomerById = async (req, res, next) => {
  const { customerId } = req.params;

  if (!customerId) {
    return next(new AppError(messages.customer.notExist, 400));
  }

  const customer = await Customer.findById(customerId);

  if (!customer) {
    return next(new AppError(messages.customer.notExist, 404));
  }

  await customer.deleteOne();

  return res.status(200).json({
    success: true,
    message: messages.customer.deleted,
  });
};