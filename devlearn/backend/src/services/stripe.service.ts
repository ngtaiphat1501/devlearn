// src/services/stripe.service.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
});

export async function createStripeSession(orderId: string, courses: Array<{ title: string; price: number; thumbnail?: string | null }>) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    metadata: { orderId },
    line_items: courses.map(c => ({
      price_data: {
        currency: 'vnd',
        product_data: {
          name: c.title,
          images: c.thumbnail ? [c.thumbnail] : [],
        },
        unit_amount: Math.round(c.price),
      },
      quantity: 1,
    })),
    success_url: `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`,
    cancel_url:  `${process.env.FRONTEND_URL}/payment/failed`,
  });
  return session;
}

export default stripe;
