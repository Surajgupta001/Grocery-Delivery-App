import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import Stripe from "stripe";
import { inngest } from "../inngest/index.js";

const endpointSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

export const stripeWebhookHandler = async (req: Request, res: Response) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
        console.error("❌ STRIPE_SECRET_KEY is missing from environment variables");
        return res.status(500).json({ error: "Stripe integration is not configured." });
    }
    const stripe = new Stripe(stripeKey);

    let event;
    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = req.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(
                req.body as any,
                signature as string,
                endpointSecret
            );
        } catch (err: any) {
            console.log(`⚠️ Webhook signature verification failed.`, err.message);
            return res.sendStatus(400);
        }
    } else {
        // In local development/testing without signing secret, parse the raw body Buffer
        try {
            event = JSON.parse((req.body as any).toString());
        } catch (err: any) {
            console.log(`⚠️ Failed to parse raw body.`, err.message);
            return res.sendStatus(400);
        }
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const paymentIntentId = paymentIntent.id;

            // Getting Session metadata
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            if (session.data.length > 0) {
                const metadata = session.data[0]?.metadata;
                const orderId = metadata ? (metadata as any).orderId : undefined;

                if (orderId) {
                    // Mark Payment as Paid
                    const paidOrder = await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            isPaid: true,
                        }
                    });

                    if (paidOrder) {
                        await inngest.send({
                            name: 'order/placed',
                            data: {
                                orderId,
                            }
                        });
                    }
                }
            }
            break;
        }
        case 'payment_intent.canceled':
        case 'payment_intent.payment_failed': {
            const paymentIntentFailure = event.data.object as Stripe.PaymentIntent;
            const paymentIntentIdFailureId = paymentIntentFailure.id;

            // Getting Session metadata
            const sessionFailure = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentIdFailureId,
            });

            if (sessionFailure.data.length > 0) {
                const metadata = sessionFailure.data[0]?.metadata;
                const failedOrderId = metadata ? (metadata as any).orderId : undefined;

                if (failedOrderId) {
                    const failedOrder = await prisma.order.findUnique({
                        where: { id: failedOrderId }
                    });

                    if (failedOrder) {
                        // Restore stock (since it was already decremented during order creation)
                        const orderItems = Array.isArray(failedOrder.items) ? failedOrder.items : [] as any[];
                        for (const item of orderItems) {
                            await prisma.product.update({
                                where: { id: item.product },
                                data: {
                                    stock: {
                                        increment: item.quantity,
                                    }
                                }
                            });

                            // Send stock update event
                            await inngest.send({
                                name: 'inventory/stock.updated',
                                data: {
                                    productId: item.product,
                                }
                            });
                        }

                        // Delete the failed order record
                        await prisma.order.delete({
                            where: { id: failedOrderId }
                        });
                    }
                }
            }
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
};