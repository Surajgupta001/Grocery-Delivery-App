import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import { generateToken, generateOTP, extractParam } from '../utils/utils.js';

// Login Delivery Partner
// POST /api/v1/delivery/login
export const loginDeliveryPartner = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        const partner = await prisma.deliveryPartner.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!partner) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        if (!partner.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.',
            });
        }

        const isMatch = await bcrypt.compare(password, partner.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const token = generateToken(partner.id, 'deliveryPartner');
        const { password: _, ...partnerData } = partner;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                partner: partnerData,
                token,
            },
        });
    } catch (error) {
        console.error('Error logging in delivery partner:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while logging in',
        });
    }
};

// Get assigned deliveries
// GET /api/v1/delivery/my-deliveries
export const getAssignedDeliveries = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        const where: any = {
            deliveryPartnerId: req.partner!.id,
        };

        if (status === 'active') {
            where.status = {
                in: ['Assigned', 'Packed', 'Out for Delivery'],
            };
        } else if (status === 'completed') {
            where.status = {
                in: ['Delivered', 'Cancelled'],
            };
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                user: {
                    select: { name: true, email: true, phone: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            success: true,
            message: 'Assigned deliveries retrieved successfully',
            data: orders,
        });
    } catch (error) {
        console.error('Error fetching assigned deliveries:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching deliveries',
        });
    }
};

// Get single assigned delivery details
// GET /api/v1/delivery/my-deliveries/:id
export const getDeliveryDetails = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);

        const order = await prisma.order.findFirst({
            where: {
                id,
                deliveryPartnerId: req.partner!.id,
            },
            include: {
                user: {
                    select: { name: true, email: true, phone: true },
                },
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Delivery details retrieved successfully',
            data: order,
        });
    } catch (error) {
        console.error('Error fetching delivery details:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching delivery details',
        });
    }
};

// Complete delivery with OTP
// PUT /api/v1/delivery/my-deliveries/:id/completed
export const completeDeliveryWithOTP = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);
        const { otp } = req.body;

        if (!otp || typeof otp !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'OTP is required',
            });
        }

        const order = await prisma.order.findFirst({
            where: {
                id,
                deliveryPartnerId: req.partner!.id,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found',
            });
        }

        if (order.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'This order has been cancelled',
            });
        }

        if (order.status === 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'This order has already been delivered',
            });
        }

        if (order.deliveryOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please try again.',
            });
        }

        const history = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];

        history.push({
            status: 'Delivered',
            note: 'Delivered by partner',
            updatedAt: new Date().toISOString(),
        });

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'Delivered',
                statusHistory: history,
                deliveryOtp: '',
            },
        });

        res.status(200).json({
            success: true,
            message: 'Delivery completed successfully',
            data: updatedOrder,
        });
    } catch (error) {
        console.error('Error completing delivery:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while completing the delivery',
        });
    }
};

// Cancel delivery by delivery partner
// PUT /api/v1/delivery/my-deliveries/:id/cancel
export const cancelDeliveryByPartner = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);
        const { reason } = req.body;

        const order = await prisma.order.findFirst({
            where: {
                id,
                deliveryPartnerId: req.partner!.id,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found',
            });
        }

        if (order.status === 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a delivered order',
            });
        }

        if (order.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Order is already cancelled',
            });
        }

        const history = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];

        history.push({
            status: 'Cancelled',
            note: `Cancelled by delivery partner. Reason: ${reason || 'No reason provided'}`,
            updatedAt: new Date().toISOString(),
        });

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'Cancelled',
                statusHistory: history,
                deliveryPartnerId: null,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Delivery cancelled successfully',
            data: updatedOrder,
        });
    } catch (error) {
        console.error('Error cancelling delivery:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while cancelling the delivery',
        });
    }
};

// Update order status by delivery partner
// PUT /api/v1/delivery/my-deliveries/:id/status
export const updateOrderStatusByPartner = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);
        const { status } = req.body;

        const allowedStatuses = ['Packed', 'Out for Delivery'];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`,
            });
        }

        const order = await prisma.order.findFirst({
            where: {
                id,
                deliveryPartnerId: req.partner!.id,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found',
            });
        }

        const history = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];

        history.push({
            status,
            note: `Status updated to ${status} by delivery partner`,
            updatedAt: new Date().toISOString(),
        });

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status,
                statusHistory: history,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: updatedOrder,
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating order status',
        });
    }
};

// Update Live location
// PUT /api/v1/delivery/my-deliveries/:id/location
export const updateLiveLocation = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);
        const { lat, lng } = req.body;

        if (lat == null || lng == null) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required',
            });
        }

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        if (isNaN(latNum) || isNaN(lngNum)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid latitude or longitude values',
            });
        }

        const order = await prisma.order.findFirst({
            where: {
                id,
                deliveryPartnerId: req.partner!.id,
                status: {
                    in: ['Assigned', 'Packed', 'Out for Delivery'],
                },
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Active delivery not found for live tracking',
            });
        }

        await prisma.order.update({
            where: { id: order.id },
            data: {
                liveLocation: {
                    lat: latNum,
                    lng: lngNum,
                    updatedAt: new Date().toISOString(),
                },
            },
        });

        res.status(200).json({
            success: true,
            message: 'Live location updated successfully',
        });
    } catch (error) {
        console.error('Error updating live location:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating live location',
        });
    }
};
