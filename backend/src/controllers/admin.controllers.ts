import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import bcrypt from 'bcryptjs';

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

// Get Admin Dashboard data - Admin Only
// GET /api/v1/admin/dashboard
export const getAdminDashboardStats = async (req: Request, res: Response) => {
    try {
        const [totalOrders, totalUsers, totalProducts, outOfStock, totalPartners, recentOrders] = await Promise.all([
            prisma.order.count({
                where: {
                    NOT: [{
                        paymentMethod: 'card',
                        isPaid: false,
                    }]
                }
            }),

            prisma.user.count(),
            prisma.product.count(),

            prisma.product.count({
                where: {
                    stock: 0
                }
            }),

            prisma.deliveryPartner.count(),
            prisma.order.findMany({
                where: {
                    NOT: [{
                        paymentMethod: 'card',
                        isPaid: false,
                    }]
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 8,
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
                        }
                    }
                },
            })
        ])

        res
            .status(200)
            .json({
                success: true,
                message: "Admin dashboard stats retrieved successfully",
                data: {
                    totalOrders,
                    totalUsers,
                    totalProducts,
                    outOfStock,
                    totalPartners,
                    recentOrders,
                }
            })
    } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching admin dashboard stats",
        });
    }
};

// Get Delivery Partners list for admin
// GET /api/v1/delivery-partners
export const getDeliveryPartners = async (req: Request, res: Response) => {
    try {
        const partners = await prisma.deliveryPartner.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })

        res.status(200).json({
            success: true,
            message: "Delivery partners retrieved successfully",
            data: partners
        });
    } catch (error) {
        console.error("Error fetching delivery partners:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching delivery partners",
        });
    }
};

// Create new Delivery Partner profile - Admin Only
// POST /api/v1/delivery-partners
export const createDeliveryPartner = async (req: Request, res: Response) => {
    try {
        const { name, email, password, phone, vehicleType } = req.body;

        if (!name || !email || !password || !phone || !vehicleType) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "All fields are required"
                });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const newPartner = await prisma.deliveryPartner.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashPassword,
                phone,
                vehicleType
            }
        });

        res.status(201).json({
            success: true,
            message: "Delivery partner created successfully",
            data: newPartner
        });

    } catch (error) {
        console.error("Error creating delivery partner:", error);
        res.status(500).json({
            success: false,
            message: "Error creating delivery partner",
        });
    }
}

// Update Delivery Partner profile - Admin Only
// PUT /api/v1/delivery-partners/:id
export const updateDeliveryPartner = async (req: Request, res: Response) => {
    const { name, phone, vehicleType, isActive } = req.body;

    const data: any = {};

    if (name) data.name = name;
    if (phone) data.phone = phone;
    if (vehicleType) data.vehicleType = vehicleType;
    if (isActive !== undefined) data.isActive = isActive;

    try {
        const partner = await prisma.deliveryPartner.update({
            where: {
                id: req.params.id as string
            },
            data
        });

        res.status(200).json({
            success: true,
            message: "Delivery partner updated successfully",
            data: partner
        });
    } catch (error) {
        console.error("Error updating delivery partner:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating delivery partner",
        });
    }
};

// Assign Delivery Partner to Order - Admin Only
// PUT /api/v1/orders/:id/assign-partner
export const assignDeliveryPartnerToOrder = async (req: Request, res: Response) => {
    try {
        const { partnerId } = req.body;

        const order = await prisma.order.findUnique({
            where: {
                id: req.params.id as string
            }
        })

        const partner = await prisma.deliveryPartner.findUnique({
            where: {
                id: partnerId
            }
        })

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        if (!order) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Order not found",
                });
        }

        if (!partner) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Delivery partner not found",
                });
        }

        let status = order.status;

        const history: any[] = Array.isArray(order.statusHistory) ? order.statusHistory : [];

        if (order.status === 'Placed' || order.status === 'Confirmed') {
            status = 'Assigned';
            history.push({
                status,
                note: `Assigned to delivery partner ${partner.name}`,
                updatedAt: new Date().toISOString(),
            })
        }

        await prisma.order.update({
            where: {
                id: order.id,
            },
            data: {
                deliveryPartnerId: partner.id,
                status,
                statusHistory: history,
                deliveryOtp: otp,
            }
        })

        res
            .status(200)
            .json({
                success: true,
                message: `Delivery partner ${partner.name} assigned to order successfully`,
            });
    } catch (error) {
        console.error("Error assigning delivery partner to order:", error);
        res.status(500).json({
            success: false,
            message: "Error assigning delivery partner to order",
        });
    }
};