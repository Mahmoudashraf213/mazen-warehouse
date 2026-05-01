import { Router } from "express";
import { getDashboard } from "./dashboard.controller.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { isAuthenticated } from "../../middleware/authentication.js";
import { isAuthorized } from "../../middleware/autheraization.js";
import { roles } from "../../utils/constant/enum.js";

const dashboardRouter = Router();

dashboardRouter.get("/",
  isAuthenticated(),
  isAuthorized([roles.USER, roles.ADMIN]),
  asyncHandler(getDashboard)
);

export default dashboardRouter;