import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

export const admin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: 'User ID missing from token',
                });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            }
        })

        if (!user) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: 'User not found',
                });
        }

        const adminEmailsEnv = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
        const adminEmails = adminEmailsEnv.split(",").map(email => email.trim().toLowerCase());

        if (adminEmails.includes(user.email.toLowerCase())) {
            if (req.user) {
                req.user.isAdmin = true;
            }
        } else {
            return res
                .status(403)
                .json({
                    success: false,
                    message: 'Access denied. Admins only.',
                });
        }

        next();
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({
                success: false,
                message: 'Admin authorization failed',
                error: error instanceof Error ? error.message : String(error)
            });
    }
};