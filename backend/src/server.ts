import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";

import authRouter from "./routes/auth.routes";
import { handleError } from "./utils/utils";

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

// Error Middleware (ALWAYS LAST)
app.use(handleError);

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});