import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";

// UPdate order status - Admin Only
// PUT /api/v1/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { status, note } = req.body;

        const order = await prisma.order.findUnique({
            where: {
                id: req.params.id as string
            }
        })

        if (!order) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Order not found",
                });
        }

        const history = (Array.isArray(order.statusHistory) ? order.statusHistory : []) as any[];
        history.push({
            status,
            note: note || `order ${status.toLowerCase()}`,
            updatedAt: new Date().toISOString(),
        })

        const updateOrder = await prisma.order.update({
            where: {
                id: req.params.id as string
            },
            data: {
                status,
                statusHistory: history
            }
        })

        res
            .status(200)
            .json({
                success: true,
                message: "Order status updated successfully",
                data: updateOrder
            });

    } catch (error) {
        res
            .status(500)
            .json({
                success: false,
                message: "Error updating order status",
            });
    }
};

// Get all orders - Admin Only
// GET /api/v1/orders/all
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                NOT: [{
                    paymentMethod: 'card',
                    isPaid: false,
                }]
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                },
                deliveryPartner: {
                    select: {
                        name: true,
                        phone: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        res.status(200).json({
            success: true,
            message: "Orders retrieved successfully",
            data: orders
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching all orders",
        });
    }
};