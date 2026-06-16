import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../types/index.js';

// Error Handling Middleware
export const handleError = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2025':
                return res.status(404).json({
                    success: false,
                    message: 'The requested resource was not found',
                });
            case 'P2002':
                return res.status(409).json({
                    success: false,
                    message: 'A record with this value already exists',
                });
            case 'P2003':
                return res.status(400).json({
                    success: false,
                    message: 'Invalid reference to related resource',
                });
            default:
                return res.status(500).json({
                    success: false,
                    message: 'A database error occurred',
                });
        }
    }

    if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token',
        });
    }

    if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token has expired',
        });
    }

    const statusCode = (error as any)?.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : (error as any)?.message || 'An error occurred';

    res.status(statusCode).json({
        success: false,
        message,
    });
};

// Generate JWT Token
export const generateToken = (id: string, role: string = 'user'): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set');
    }

    return jwt.sign({ id, role }, secret, {
        expiresIn: '15m',
    });
};

// Generate Refresh Token
export const generateRefreshToken = (id: string, role: string = 'user'): string => {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }

    return jwt.sign({ id, role }, secret, {
        expiresIn: '7d',
    });
};

// Verify Token
export const verifyToken = (token: string): JwtPayload => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set');
    }

    return jwt.verify(token, secret) as JwtPayload;
};

// Check Admin Status
export const isUserAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;

    const adminEmails = process.env.ADMIN_EMAIL
        ? process.env.ADMIN_EMAIL.split(',').map((e) => e.trim().toLowerCase())
        : [];

    return adminEmails.includes(email.toLowerCase());
};

// Generate cryptographically secure OTP
export const generateOTP = (): string => {
    return crypto.randomInt(100000, 999999).toString();
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Sanitize string input
export const sanitizeString = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
};

// Safely extract a string param from Express 5 params (string | string[])
export const extractParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] ?? '';
    return param ?? '';
};
