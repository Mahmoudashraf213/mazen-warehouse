import { Router } from "express";
import { getDashboard } from "./dashboard.controller.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  asyncHandler(getDashboard)
);

export default dashboardRouter;