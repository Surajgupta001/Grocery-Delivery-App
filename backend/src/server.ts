import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/products.routes.js";
import adminRouter from "./routes/admin.routes.js";
import orderRouter from "./routes/order.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import { handleError } from "./utils/utils.js";
import { functions, inngest } from "./inngest/index.js";
import { serve } from "inngest/express";
import addressRouter from "./routes/address.routes.js";
import deliveryPartnerRouter from "./routes/deliveryPartner.routes.js";

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
app.use('/api/v1/addresses', addressRouter);
app.use('/api/v1/delivery', deliveryPartnerRouter);

// Error Middleware (ALWAYS LAST)
app.use(handleError);

// Start Server
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
  });
}

export default app;