import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export const admin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const adminEmailsEnv = process.env.ADMIN_EMAIL || '';
        const adminEmails = adminEmailsEnv
            .split(',')
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean);

        if (!adminEmails.includes(user.email.toLowerCase())) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admins only.',
            });
        }

        if (req.user) {
            req.user.isAdmin = true;
        }

        next();
    } catch (error) {
        console.error('Admin authorization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization check failed',
        });
    }
};
