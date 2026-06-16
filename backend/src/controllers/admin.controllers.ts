import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import {
    ORDER_STATUS,
    VALID_ORDER_TRANSITIONS,
} from '../types/index.js';
import type { PartnerUpdateInput } from '../types/index.js';
import { generateOTP, extractParam } from '../utils/utils.js';

// Update order status - Admin Only
// PUT /api/v1/admin/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);
        const { status, note } = req.body;

        if (!status || typeof status !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Status is required',
            });
        }

        if (!Object.values(ORDER_STATUS).includes(status as any)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed: ${Object.values(ORDER_STATUS).join(', ')}`,
            });
        }

        const order = await prisma.order.findUnique({ where: { id } });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        const currentStatus = order.status as string;
        const allowedTransitions = VALID_ORDER_TRANSITIONS[currentStatus] || [];

        if (!allowedTransitions.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from "${currentStatus}" to "${status}". Allowed: ${allowedTransitions.join(', ') || 'none'}`,
            });
        }

        const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
        history.push({
            status,
            note: note || `Order ${status.toLowerCase()} by admin`,
            updatedAt: new Date().toISOString(),
        });

        const updatedOrder = await prisma.order.update({
            where: { id },
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

// Get all orders - Admin Only
// GET /api/v1/admin/all
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { status, page = '1', limit = '50' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
        const skip = (pageNum - 1) * limitNum;

        const where: any = {
            NOT: [{ paymentMethod: 'card', isPaid: false }],
        };

        if (status && status !== 'all') {
            where.status = status;
        }

        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: { name: true, email: true },
                    },
                    deliveryPartner: {
                        select: { name: true, phone: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            prisma.order.count({ where }),
        ]);

        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: {
                orders,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalCount,
                    limit: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching orders',
        });
    }
};

// Get Admin Dashboard data - Admin Only
// GET /api/v1/admin/stats
export const getAdminDashboardStats = async (req: Request, res: Response) => {
    try {
        const validOrderFilter = {
            NOT: [{ paymentMethod: 'card', isPaid: false }],
        };

        const [totalOrders, totalUsers, totalProducts, outOfStock, totalPartners, recentOrders] =
            await Promise.all([
                prisma.order.count({ where: validOrderFilter }),
                prisma.user.count(),
                prisma.product.count(),
                prisma.product.count({ where: { stock: 0 } }),
                prisma.deliveryPartner.count(),
                prisma.order.findMany({
                    where: validOrderFilter,
                    orderBy: { createdAt: 'desc' },
                    take: 8,
                    include: {
                        user: { select: { name: true, email: true } },
                        deliveryPartner: { select: { name: true, phone: true } },
                    },
                }),
            ]);

        res.status(200).json({
            success: true,
            message: 'Admin dashboard stats retrieved successfully',
            data: {
                totalOrders,
                totalUsers,
                totalProducts,
                outOfStock,
                totalPartners,
                recentOrders,
            },
        });
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching dashboard stats',
        });
    }
};

// Get Delivery Partners list for admin
// GET /api/v1/admin/delivery-partners
export const getDeliveryPartners = async (req: Request, res: Response) => {
    try {
        const partners = await prisma.deliveryPartner.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                vehicleType: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Delivery partners retrieved successfully',
            data: partners,
        });
    } catch (error) {
        console.error('Error fetching delivery partners:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching delivery partners',
        });
    }
};

// Create new Delivery Partner profile - Admin Only
// POST /api/v1/admin/delivery-partners
export const createDeliveryPartner = async (req: Request, res: Response) => {
    try {
        const { name, email, password, phone, vehicleType } = req.body;

        if (!name || !email || !password || !phone || !vehicleType) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: name, email, password, phone, vehicleType',
            });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters',
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        const existingPartner = await prisma.deliveryPartner.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (existingPartner) {
            return res.status(409).json({
                success: false,
                message: 'A delivery partner with this email already exists',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newPartner = await prisma.deliveryPartner.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                phone: phone.trim(),
                vehicleType: vehicleType.trim(),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                vehicleType: true,
                isActive: true,
                createdAt: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Delivery partner created successfully',
            data: newPartner,
        });
    } catch (error) {
        console.error('Error creating delivery partner:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the delivery partner',
        });
    }
};

// Update Delivery Partner profile - Admin Only
// PUT /api/v1/admin/delivery-partners/:id
export const updateDeliveryPartner = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);
        const { name, phone, vehicleType, isActive } = req.body;

        const existingPartner = await prisma.deliveryPartner.findUnique({ where: { id } });
        if (!existingPartner) {
            return res.status(404).json({
                success: false,
                message: 'Delivery partner not found',
            });
        }

        const updateData: PartnerUpdateInput = {};

        if (name !== undefined) updateData.name = String(name).trim();
        if (phone !== undefined) updateData.phone = String(phone).trim();
        if (vehicleType !== undefined) updateData.vehicleType = String(vehicleType).trim();
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update provided',
            });
        }

        const partner = await prisma.deliveryPartner.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                vehicleType: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Delivery partner updated successfully',
            data: partner,
        });
    } catch (error) {
        console.error('Error updating delivery partner:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the delivery partner',
        });
    }
};

// Assign Delivery Partner to Order - Admin Only
// PUT /api/v1/admin/:id/assign
export const assignDeliveryPartnerToOrder = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);
        const { partnerId } = req.body;

        if (!partnerId) {
            return res.status(400).json({
                success: false,
                message: 'Partner ID is required',
            });
        }

        const [order, partner] = await Promise.all([
            prisma.order.findUnique({ where: { id } }),
            prisma.deliveryPartner.findUnique({ where: { id: partnerId } }),
        ]);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Delivery partner not found',
            });
        }

        if (!partner.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Cannot assign a deactivated delivery partner',
            });
        }

        let status = order.status as string;
        const history: any[] = Array.isArray(order.statusHistory) ? order.statusHistory : [];

        if (order.status === ORDER_STATUS.PLACED || order.status === ORDER_STATUS.CONFIRMED) {
            status = ORDER_STATUS.ASSIGNED;
            history.push({
                status,
                note: `Assigned to delivery partner ${partner.name}`,
                updatedAt: new Date().toISOString(),
            });
        }

        const otp = generateOTP();

        await prisma.order.update({
            where: { id: order.id },
            data: {
                deliveryPartnerId: partner.id,
                status,
                statusHistory: history,
                deliveryOtp: otp,
            },
        });

        res.status(200).json({
            success: true,
            message: `Delivery partner ${partner.name} assigned to order successfully`,
        });
    } catch (error) {
        console.error('Error assigning delivery partner to order:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while assigning the delivery partner',
        });
    }
};
