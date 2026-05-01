import { model, Schema } from "mongoose";
import { roles } from "../../src/utils/constant/enum.js";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true, 
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isVerified: {   
  type: Boolean,
    default: true,
}, 
roles: {
  type: String,
  enum: Object.values(roles),
  default: roles.USER,
},
  },
  { timestamps: true }
);



export const User = model("User", userSchema);