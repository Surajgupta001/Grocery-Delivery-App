import type { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import bcrypt from 'bcryptjs';
import { generateToken } from "../utils/utils";

// Login Delivery Partner
// POST /api/v1/delivery-partners/Login
export const loginDeliveryPartner = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Email and password are required',
                });
        }

        const partner = await prisma.deliveryPartner.findUnique({
            where: {
                email: email.toLowerCase(),
            },
        })

        if (!partner) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Invalid email or password',
                });
        }

        if (!partner.isActive) {
            return res
                .status(403)
                .json({
                    success: false,
                    message: 'Your account has been deactivated. Please contact support.',
                });
        }

        const isMatch = await bcrypt.compare(password, partner.password);

        if (!isMatch) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Invalid email or password',
                });
        }

        // role - deliveryPartner
        const token = generateToken(partner.id, "deliveryPartner");
        const { password: _, ...partnerData } = partner;

        res
            .status(200)
            .json({
                success: true,
                message: 'Login successful as Delivery Partner',
                data: {
                    partner: partnerData,
                    token,
                }
            });
    } catch (error) {
        console.error('Error occurred while logging in delivery partner:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while logging in. Please try again later.',
        });
    }
};

// Get assigned deliveries
// GET /api/v1/delivery-partners/my-deliveries
export const getAssignedDeliveries = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        const where: any = {
            deliveryPartnerId: req.partner!.id,
        }

        if (status === 'active') {
            where.status = {
                in: [
                    'Assigned', 'Packed', 'Out for Delivery'
                ]
            }
        } else if (status === 'completed') {
            where.status = {
                in: [
                    'Delivered', 'Cancelled'
                ]
            }
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        res
            .status(200)
            .json({
                success: true,
                message: "Assigned deliveries retrieved successfully",
                orders
            });
    } catch (error) {
        console.error('Error occurred while fetching assigned delivery partner:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching delivery partner details. Please try again later.',
        });
    }
};

// Get single assigned delivery details
// GET /api/v1/delivery-partners/my-deliveries/:id
export const getDeliveryDetails = async (req: Request, res: Response) => {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: req.params.id as string,
                deliveryPartnerId: req.partner!.id,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
            }
        })

        if (!order) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Delivery not found",
                });
        }

        res
            .status(200)
            .json({
                success: true,
                message: "Delivery details retrieved successfully",
                order
            });

    } catch (error) {
        console.error('Error occurred while fetching assigned delivery partner details:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching delivery partner details. Please try again later.',
        });
    }
};

// Complete delivery with OTP
// POST /api/v1/delivery-partners/my-deliveries/:id/complete
export const completeDeliveryWithOTP = async (req: Request, res: Response) => {
    try {
        const { otp } = req.body;
        const order = await prisma.order.findFirst({
            where: {
                id: req.params.id as string,
                deliveryPartnerId: req.partner!.id,
            },
        })

        if (!order || order.status === 'Cancelled') {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Delivery not found or has been cancelled",
                });
        }

        if (order.deliveryOtp !== otp) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Invalid OTP. Please try again.",
                });
        }

        const history = (Array.isArray(order.statusHistory) ? order.statusHistory : []) as any[];

        history.push({
            status: 'Delivered',
            note: 'Delivered by partner',
            timeStamp: new Date().toISOString(),
        })

        const updatedOrder = await prisma.order.update({
            where: {
                id: order.id,
            },
            data: {
                status: 'Delivered',
                statusHistory: history,
                deliveryOtp: ""
            }
        })

        res
            .status(200)
            .json({
                success: true,
                message: "Delivery completed successfully",
                order: updatedOrder
            });
    } catch (error) {
        console.error('Error occurred while completing delivery:', error);
        res
            .status(500)
            .json({
                success: false,
                message: 'An error occurred while completing delivery. Please try again later.',
            });
    }
};

// Cancel delivery by delivery partner
// POST /api/v1/delivery-partners/my-deliveries/:id/cancel
export const cancelDeliveryByPartner = async (req: Request, res: Response) => {
    try {
        const { reason } = req.body;

        const order = await prisma.order.findFirst({
            where: {
                id: req.params.id as string,
                deliveryPartnerId: req.partner!.id,
            },
        })

        if (!order) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Delivery not found",
                });
        }

        if (order.status === 'Delivered') {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Delivery has already been delivered! You cannot cancel it now.",
                });

        }

        const history = (Array.isArray(order.statusHistory) ? order.statusHistory : []) as any[];

        history.push({
            status: 'Cancelled',
            note: `Cancelled by delivery partner. Reason: ${reason || 'No reason provided'}`,
            timeStamp: new Date().toISOString(),
        })

        const updatedOrder = await prisma.order.update({
            where: {
                id: order!.id,
            },
            data: {
                status: 'Cancelled',
                statusHistory: history,
            }
        })

        res
            .status(200)
            .json({
                success: true,
                message: "Delivery cancelled successfully",
                order: updatedOrder
            });
    } catch (error) {
        console.error('Error occurred while cancelling delivery:', error);
        res
            .status(500)
            .json({
                success: false,
                message: 'An error occurred while cancelling delivery. Please try again later.',
            });
    }
};

// Update order status by delivery partner
// PUT /api/v1/delivery-partners/my-deliveries/:id/status
export const updateOrderStatusByPartner = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;

        const allowedStatuses = ['Packed', 'Out for Delivery'];

        if (!allowedStatuses.includes(status)) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(', ')}`,
                });
        }

        const order = await prisma.order.findFirst({
            where: {
                id: req.params.id as string,
                deliveryPartnerId: req.partner!.id,
            },
        })

        if (!order) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Delivery not found",
                });
        }

        const history = (Array.isArray(order.statusHistory) ? order.statusHistory : []) as any[];

        history.push({
            status,
            note: `Status updated to ${status} by delivery partner`,
            timeStamp: new Date().toISOString(),
        })

        const updatedOrder = await prisma.order.update({
            where: {
                id: order!.id,
            },
            data: {
                status,
                statusHistory: history,
            }
        })

        res
            .status(200)
            .json({
                success: true,
                message: "Order status updated successfully",
                order: updatedOrder
            });
    } catch (error) {
        console.error('Error occurred while updating order status:', error);
        res
            .status(500)
            .json({
                success: false,
                message: 'An error occurred while updating order status. Please try again later.',
            });
    }
};

// Update Live location
// PUT /api/v1/delivery-partners/my-deliveries/:id/location
export const updateLiveLocation = async (req: Request, res: Response) => {
    try {
        const { lat, lng } = req.body;

        const order = await prisma.order.findFirst({
            where: {
                id: req.params.id as string,
                deliveryPartnerId: req.partner!.id,
                status: {
                    in: [
                        'Assigned', 'Packed', 'Out for Delivery'
                    ]
                }
            },
        })

        if (!order) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Active delivery not found for live tracking",
                });
        }

        await prisma.order.update({
            where: {
                id: order.id,
            },
            data: {
                liveLocation: {
                    lat,
                    lng,
                    updatedAt: new Date().toISOString(),
                }
            }
        })

        res
            .status(200)
            .json({
                success: true,
                message: "Live location updated successfully",
            });
    } catch (error) {
        console.error('Error occurred while updating live location:', error);
        res
            .status(500)
            .json({
                success: false,
                message: 'An error occurred while updating live location. Please try again later.',
            });
    }
};