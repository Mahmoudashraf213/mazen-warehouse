import cors from "cors";
import { globalErrorHandling } from "./utils/appError.js";
import { customerRouter, invoiceRouter, productRouter } from "./modules/index.js";

export const bootStrap = (app, express) => {
  // parse req
  app.use(express.json());
  // cors edit
  const corsOptions = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  };
  app.use(cors(corsOptions));
  // routes
  app.use("product", productRouter);
  app.use("customer", customerRouter);
  app.use("invoice", invoiceRouter);
  // global error
  app.use(globalErrorHandling);
};
