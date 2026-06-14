import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Error Handling Middleware
export const handleError = (error: any, req: Request, res: Response, next: NextFunction) => {
    console.error(error);

    return res
        .status(error.statusCode || 500)
        .json({
            success: false,
            message: error.message || "Internal Server Error",
        });
};

// Generate JWT Token
export const generateToken = (id: string) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "30d",
        }
    );
};

// Check Admin Status
export const getAdminStatus = (email: string | null | undefined): boolean => {
    if (!email) return false;

    const adminEmails = process.env.ADMIN_EMAIL?.split(",").map((e) => e.trim().toLowerCase()) || [];

    return adminEmails.includes(email.toLowerCase());
};