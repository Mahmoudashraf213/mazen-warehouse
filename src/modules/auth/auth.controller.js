import bcrypt from "bcrypt";
import { AppError } from "../../utils/appError.js";
import { messages } from "../../utils/constant/messages.js";
import { generateToken } from "../../utils/token.js";
import { User } from "../../../db/index.js";

// REGISTER
export const register = async (req, res, next) => {
  const { name, email, phone, code, password } = req.body;

  // check exists
  const userExists = await User.findOne({
    $or: [{ email }, { code }]
  });

  if (userExists) {
    return next(new AppError(messages.user.alreadyExist, 409));
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // create user
  const user = await User.create({
    name,
    email,
    phone,
    code,
    password: hashedPassword
  });

  return res.status(201).json({
    message: messages.user.accountCreated,
    success: true,
    data: user
  });
};

// LOGIN
export const login = async (req, res, next) => {
  const { code, password } = req.body;

  // find user by code 
  const user = await User.findOne({ code }).select("+password");

  if (!user) {
    return next(new AppError(messages.user.invalidCredentials, 401));
  }

  // check password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return next(new AppError(messages.user.invalidCredentials, 401));
  }

  // generate token (simple)
  const token = generateToken({
    payload: {
      _id: user._id,
      email: user.email
    }
  });

  return res.status(200).json({
    message: messages.user.loginSuccess,
    success: true,
    token,
  });
};


// GET USER PROFILE
export const getUserProfile = async (req, res, next) => {
  const userId = req.authUser._id;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError(messages.user.notExist, 404));
  }

  return res.status(200).json({
    message: messages.user.fetchedSuccessfully,
    success: true,
    data: user
  });
};

// UPDATE USER PROFILE
export const updateUserProfile = async (req, res, next) => {
  const userId = req.authUser._id;

  const { name, email, phone, code } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError(messages.user.notExist, 404));
  }

  // check email duplication
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return next(new AppError(messages.user.emailTaken, 409));
    }
    user.email = email;
  }

  // check code duplication
  if (code && code !== user.code) {
    const codeExists = await User.findOne({ code });
    if (codeExists) {
      return next(new AppError(messages.user.codeTaken, 409));
    }
    user.code = code;
  }

  // update normal fields
  if (name) user.name = name;
  if (phone) user.phone = phone;

  const updatedUser = await user.save();

  return res.status(200).json({
    message: messages.user.updated,
    success: true,
    data: updatedUser
  });
};