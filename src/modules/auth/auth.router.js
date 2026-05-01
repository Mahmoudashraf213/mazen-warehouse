import { Router } from "express";
import { isAuthenticated } from "../../middleware/authentication.js";
import { isAuthorized } from "../../middleware/autheraization.js";
import { isValid } from "../../middleware/vaildation.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { loginSchema, registerSchema, updateUserSchema } from "./auth.validation.js";
import { getUserProfile, login, register, updateUserProfile } from "./auth.controller.js";
import { roles } from "../../utils/constant/enum.js";


const authRouter = Router();

//register route
authRouter.post("/register",
isValid(registerSchema),
asyncHandler(register)
);

//login route
authRouter.post("/login",
isValid(loginSchema),
asyncHandler(login)
);

// get current user route
authRouter.get("/",
    isAuthenticated(),
    isAuthorized([roles.USER]),
    asyncHandler(getUserProfile)
);

// update user route
authRouter.put("/update",
    isAuthenticated(),
    isAuthorized([roles.USER, roles.ADMIN]),
    isValid(updateUserSchema),
    asyncHandler(updateUserProfile)
);

export default authRouter;