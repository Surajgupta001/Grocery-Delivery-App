import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import 'dotenv/config';
import authRouter from './routes/auth.routes.js';
import productRouter from './routes/products.routes.js';
import adminRouter from './routes/admin.routes.js';
import orderRouter from './routes/order.routes.js';
import uploadRouter from './routes/upload.routes.js';
import { handleError } from './utils/utils.js';
import { functions, inngest } from './inngest/index.js';
import { serve } from 'inngest/express';
import addressRouter from './routes/address.routes.js';
import deliveryPartnerRouter from './routes/deliveryPartner.routes.js';
import { stripeWebhookHandler } from './controllers/stripeWebhooks.controllers.js';

const app = express();
const port = process.env.PORT || 5000;

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Stripe webhook needs raw body - must come before express.json()
app.post('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// Security headers
app.use(helmet());

// Compression
app.use(compression());

// CORS configuration
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
    : ['http://localhost:5173'];

const isOriginAllowed = (origin: string): boolean => {
    // Check if origin matches allowedOrigins list
    if (allowedOrigins.includes(origin)) {
        return true;
    }
    // Allow local development origins on localhost or 127.0.0.1 (any port)
    if (/^https?:\/\/localhost:\d+$/.test(origin) || /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
        return true;
    }
    // Allow any Vercel deployment for the grocery delivery app
    if (/^https:\/\/grocery-delivery-app.*\.vercel\.app$/.test(origin)) {
        return true;
    }
    return false;
};

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || isOriginAllowed(origin)) {
                callback(null, true);
            } else {
                console.warn(`[CORS] Request from origin ${origin} was blocked.`);
                callback(null, false);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400,
    })
);

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Global rate limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later',
    },
});
app.use(globalLimiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later',
    },
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Default Route
app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        version: '1.0.0',
    });
});

// Routes
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/inngest', serve({ client: inngest, functions }));
app.use('/api/v1/addresses', addressRouter);
app.use('/api/v1/delivery', deliveryPartnerRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error Middleware (ALWAYS LAST)
app.use(handleError);

// Start Server
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;
