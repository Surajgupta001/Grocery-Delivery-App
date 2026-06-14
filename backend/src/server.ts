import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default Route
app.get('/', (req: Request, res: Response) => {
  res.send('API Working 🚀');
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});