import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { inngest } from "../inngest/index.js";
import Stripe from "stripe";

// Create Order
// POST /api/v1/orders
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;

        // Check if order items are empty
        if (!items || items.length === 0) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "No order items",
                })
        }

        // Look up actual price from the database
        const productIds = items.map((item: any) => item.product);
        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
        })

        const productMap = <Record<string, (typeof products)[0]>>{};
        products.forEach((product: any) => {
            productMap[product.id] = product;
        });

        // Check if product is in stock
        for (const item of items) {
            const product = productMap[item.product];

            if (!product || (product.stock ?? 0) < item.quantity) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message: `Product ${item.product} is not in stock`,
                    });
            }
        }

        const orderItems = items.map((item: any) => {
            const dbProduct = productMap[item.product];

            if (!dbProduct) {
                throw new Error(`Product with ID ${item.product} not found`);
            }

            return {
                product: dbProduct.id,
                name: dbProduct.name,
                image: dbProduct.image,
                price: dbProduct.price,
                quantity: item.quantity,
                unit: dbProduct.unit,
            }
        })

        const subTotal = orderItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
        const deliveryFee = subTotal < 50 ? 5 : 0; // Example: $5 delivery fee for orders under $50
        const tax = Math.round(subTotal * 0.07 * 100) / 100; // Example: 7% tax
        const total = Math.round((subTotal + deliveryFee + tax) * 100) / 100;

        const order = await prisma.order.create({
            data: {
                userId: req.user!.id,
                items: orderItems,
                shippingAddress,
                paymentMethod,
                subtotal: subTotal,
                deliveryFee,
                tax,
                total,
                statusHistory: [{
                    status: "Placed",
                    timestamp: new Date(),
                    note: "Order placed by user successfully",
                }]
            }
        })

        if (paymentMethod === 'card') {

            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

            // Create Session
            const session = await stripe.checkout.sessions.create({
                success_url: `${req.headers.origin}/orders?clearCart=true`,
                cancel_url: `${req.headers.origin}/checkout`,
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: 'Payment Groceries',
                            },
                            unit_amount: Math.round(total * 100), // Stripe expects amount in cents
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                metadata: {
                    orderId: order.id,
                }
            });

            return res
                .json({
                    url: session.url,
                })
        }

        res
            .status(201)
            .json({
                success: true,
                message: "Order created successfully",
                data: order
            });

        // Decrease stock for each product
        for (const item of items) {
            await prisma.product.update({
                where: { id: item.product },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            });
        }

        // Send stock update events for each product in the order
        for (const item of orderItems) {
            await inngest.send({
                name: 'inventory/stock.updated',
                data: {
                    productId: item.product,
                }
            })
        }

        await inngest.send({
            name: 'order/placed',
            data: {
                orderId: order.id,
            }
        })
    } catch (error) {
        console.error("Error creating order:", error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error creating order",
            });
    }
};

// Get User's Orders
// GET /api/v1/orders
export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        const where: any = {
            userId: req.user!.id,
            NOT: [{
                paymentMethod: 'card',
                isPaid: false,
            }]
        }

        if (status && status != 'all') {
            where.status = status;
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                deliveryPartner: {
                    select: {
                        name: true,
                        phone: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            }
        })

        res
            .status(200)
            .json({
                success: true,
                message: "User orders fetched successfully",
                data: orders
            });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error fetching user orders",
            });
    }
};

// Get single order
// GET /api/v1/orders/:id
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: req.params.id as string,
                userId: req.user!.id,
            },
            include: {
                deliveryPartner: {
                    select: {
                        name: true,
                        phone: true,
                        avatar: true,
                        vehicleType: true,
                    }
                }
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

        res
            .status(200)
            .json({
                success: true,
                message: "Order fetched successfully",
                data: order
            });

    } catch (error) {
        console.error("Error fetching order:", error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error fetching order",
            });
    }
};

// Get order location
// GET /api/v1/orders/:id/location
export const getOrderLocation = async (req: Request, res: Response) => {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: req.params.id as string,
                userId: req.user!.id,
            },
            select: {
                liveLocation: true,
                status: true
            }
        })

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res
            .status(200)
            .json({
                success: true,
                message: "Order location retrieved successfully",
                liveLocation: order.liveLocation,
                status: order.status
            });

    } catch (error) {
        res
            .status(500)
            .json({
                success: false,
                message: "Error fetching order location"
            });
    }
};