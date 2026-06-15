import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";

export const deliveryAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Unauthorized: No token provided",
                });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Unauthorized: Invalid token format",
                });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as unknown as { id: string, role: string };

        if (decoded.role !== 'deliveryPartner') {
            return res
                .status(403)
                .json({
                    success: false,
                    message: "Forbidden: Access is denied",
                });
        }

        const partner = await prisma.deliveryPartner.findUnique({
            where: {
                id: decoded.id,
            },
        });

        if (!partner || !partner.isActive) {
            return res
                .status(403)
                .json({
                    success: false,
                    message: "Forbidden: Account is deactivated or does not exist",
                });
        }

        req.partner = partner;
        next();

    } catch (error) {
        console.log("Delivery Auth Error:", error);
        return res
            .status(401)
            .json({
                success: false,
                message: "Unauthorized: Invalid token",
            });
    }
};