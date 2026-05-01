import { AppError } from "../utils/appError.js";
import { messages } from "../utils/constant/messages.js";
import { verifyToken } from "../utils/token.js";
import { User } from "../../db/index.js";

export const isAuthenticated = () => {
  return async (req, res, next) => {

    const { token } = req.headers;

    if (!token) {
      return next(new AppError("token not provided", 401));
    }

    const payload = verifyToken(token);

    if (payload.message) {
      return next(new AppError(payload.message, 401));
    }

    const authUser = await User.findOne({
      _id: payload._id,
      isVerified: true
    });

    if (!authUser) {
      return next(new AppError(messages.user.notExist, 404));
    }

    req.authUser = authUser;

    next();
  };
};