import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { inngest } from '../inngest/index.js';
import Stripe from 'stripe';
import type { CreateOrderInput, OrderItem } from '../types/index.js';
import { extractParam } from '../utils/utils.js';
import { Prisma } from '@prisma/client';

// Create Order
// POST /api/v1/orders
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body as CreateOrderInput;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order items are required and must be a non-empty array',
            });
        }

        for (const item of items) {
            if (!item.product || !item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have a valid product ID and quantity >= 1',
                });
            }
        }

        if (!shippingAddress) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address is required',
            });
        }

        if (!paymentMethod || !['card', 'cash'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Payment method must be either "card" or "cash"',
            });
        }

        const productIds = items.map((item) => item.product);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        for (const item of items) {
            const product = productMap.get(item.product);
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product with ID "${item.product}" not found`,
                });
            }
            if ((product.stock ?? 0) < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
                });
            }
        }

        const orderItems: OrderItem[] = items.map((item) => {
            const dbProduct = productMap.get(item.product)!;
            return {
                product: dbProduct.id,
                name: dbProduct.name,
                image: dbProduct.image,
                price: dbProduct.price,
                quantity: item.quantity,
                unit: dbProduct.unit || 'piece',
            };
        });

        const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const deliveryFee = subtotal < 50 ? 5 : 0;
        const tax = Math.round(subtotal * 0.07 * 100) / 100;
        const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

        const order = await prisma.order.create({
            data: {
                userId: req.user!.id,
                items: orderItems as unknown as Prisma.InputJsonValue,
                shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
                paymentMethod,
                subtotal,
                deliveryFee,
                tax,
                total,
                statusHistory: [
                    {
                        status: 'Placed',
                        timestamp: new Date(),
                        note: 'Order placed by user',
                    },
                ] as unknown as Prisma.InputJsonValue,
            },
        });

        if (paymentMethod === 'card') {
            const stripeKey = process.env.STRIPE_SECRET_KEY;
            if (!stripeKey) {
                return res.status(500).json({
                    success: false,
                    message: 'Payment processing is not configured',
                });
            }

            const stripe = new Stripe(stripeKey);
            const session = await stripe.checkout.sessions.create({
                success_url: `${req.headers.origin}/orders?clearCart=true`,
                cancel_url: `${req.headers.origin}/checkout`,
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: { name: 'Grocery Order' },
                            unit_amount: Math.round(total * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                metadata: { orderId: order.id },
            });

            return res.status(200).json({
                success: true,
                message: 'Checkout session created',
                data: { url: session.url, orderId: order.id },
            });
        }

        // For cash orders, decrement stock immediately within a transaction
        await prisma.$transaction(async (tx) => {
            for (const item of items) {
                const result = await tx.product.updateMany({
                    where: {
                        id: item.product,
                        stock: { gte: item.quantity },
                    },
                    data: {
                        stock: { decrement: item.quantity },
                    },
                });

                if (result.count === 0) {
                    throw new Error(`Insufficient stock for product ${item.product}`);
                }
            }
        });

        for (const item of orderItems) {
            await inngest.send({
                name: 'inventory/stock.updated',
                data: { productId: item.product },
            });
        }

        await inngest.send({
            name: 'order/placed',
            data: { orderId: order.id },
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the order',
        });
    }
};

// Get User's Orders
// GET /api/v1/orders
export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const { status, page = '1', limit = '20' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const where: any = {
            userId: req.user!.id,
            NOT: [{ paymentMethod: 'card', isPaid: false }],
        };

        if (status && status !== 'all') {
            where.status = status;
        }

        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    deliveryPartner: {
                        select: { name: true, phone: true },
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
            message: 'User orders fetched successfully',
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
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching orders',
        });
    }
};

// Get single order
// GET /api/v1/orders/:id
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);

        const order = await prisma.order.findFirst({
            where: {
                id,
                userId: req.user!.id,
            },
            include: {
                deliveryPartner: {
                    select: {
                        name: true,
                        phone: true,
                        avatar: true,
                        vehicleType: true,
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order fetched successfully',
            data: order,
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the order',
        });
    }
};

// Get order location
// GET /api/v1/orders/:id/location
export const getOrderLocation = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);

        const order = await prisma.order.findFirst({
            where: {
                id,
                userId: req.user!.id,
            },
            select: {
                liveLocation: true,
                status: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order location retrieved successfully',
            data: {
                liveLocation: order.liveLocation,
                status: order.status,
            },
        });
    } catch (error) {
        console.error('Error fetching order location:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching order location',
        });
    }
};
