import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";

import authRouter from "./routes/auth.routes";
import { handleError } from "./utils/utils";
import productRouter from "./routes/products.routes";
import adminRouter from "./routes/admin.routes";
import orderRouter from "./routes/order.routes";
import uploadRouter from "./routes/upload.routes";
import { serve } from "inngest/express";
import { inngest, functions } from "../src/inngest/index";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default Route
app.get("/", (req: Request, res: Response) => {
  res.send("API Working 🚀");
});

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/upload", uploadRouter);
// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

// Error Middleware (ALWAYS LAST)
app.use(handleError);

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});

export default app;