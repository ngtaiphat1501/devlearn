// src/routes/order.routes.ts
import { Router } from 'express';
import { createOrder, vnpayReturn, stripeWebhook, grantAccess, getMyOrders } from '../controllers/order.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import express from 'express';

const router = Router();

router.post('/', authenticate as any, createOrder as any);
router.get('/my', authenticate as any, getMyOrders as any);
router.get('/vnpay/return', vnpayReturn as any);
// Stripe webhook needs raw body
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook as any);
router.post('/grant-access', authenticate as any, requireRole('ADMIN') as any, grantAccess as any);

export default router;
