import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import Stripe from 'stripe';
import { inngest } from '../inngest/index.js';

export const stripeWebhookHandler = async (req: Request, res: Response) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
        console.error('STRIPE_SECRET_KEY is missing from environment variables');
        return res.status(500).json({ error: 'Stripe integration is not configured' });
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

    if (!endpointSecret && process.env.NODE_ENV === 'production') {
        console.error('STRIPE_WEBHOOK_SIGNING_SECRET is missing in production');
        return res.status(500).json({ error: 'Webhook verification is not configured' });
    }

    const stripe = new Stripe(stripeKey);

    let event: Stripe.Event;

    if (endpointSecret) {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            return res.status(400).json({ error: 'Missing stripe-signature header' });
        }

        try {
            event = stripe.webhooks.constructEvent(
                req.body as Buffer,
                signature as string,
                endpointSecret
            );
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error(`Webhook signature verification failed: ${errorMessage}`);
            return res.status(400).json({ error: 'Invalid signature' });
        }
    } else {
        // Local development only - parse raw body
        try {
            event = JSON.parse((req.body as Buffer).toString());
        } catch (err: unknown) {
            console.error('Failed to parse webhook body');
            return res.status(400).json({ error: 'Invalid payload' });
        }
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const session = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                });

                if (session.data.length > 0) {
                    const orderId = session.data[0]?.metadata?.orderId;
                    if (orderId) {
                        const paidOrder = await prisma.order.update({
                            where: { id: orderId },
                            data: { isPaid: true },
                        });

                        if (paidOrder) {
                            await inngest.send({
                                name: 'order/placed',
                                data: { orderId },
                            });
                        }
                    }
                }
                break;
            }

            case 'payment_intent.canceled':
            case 'payment_intent.payment_failed': {
                const paymentIntentFailure = event.data.object as Stripe.PaymentIntent;
                const sessionFailure = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntentFailure.id,
                });

                if (sessionFailure.data.length > 0) {
                    const failedOrderId = sessionFailure.data[0]?.metadata?.orderId;
                    if (failedOrderId) {
                        const failedOrder = await prisma.order.findUnique({
                            where: { id: failedOrderId },
                        });

                        if (failedOrder) {
                            const orderItems = Array.isArray(failedOrder.items)
                                ? (failedOrder.items as any[])
                                : [];

                            await prisma.$transaction(async (tx) => {
                                for (const item of orderItems) {
                                    await tx.product.update({
                                        where: { id: item.product },
                                        data: { stock: { increment: item.quantity } },
                                    });
                                }

                                await tx.order.delete({
                                    where: { id: failedOrderId },
                                });
                            });

                            for (const item of orderItems) {
                                await inngest.send({
                                    name: 'inventory/stock.updated',
                                    data: { productId: item.product },
                                });
                            }
                        }
                    }
                }
                break;
            }

            default:
                console.log(`Unhandled webhook event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};
