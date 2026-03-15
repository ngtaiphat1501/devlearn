// src/controllers/order.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { createVNPayUrl, verifyVNPayReturn } from '../services/vnpay.service';
import { createStripeSession } from '../services/stripe.service';
import { sendPurchaseConfirmEmail } from '../services/email.service';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseIds, paymentMethod = 'VNPAY' } = req.body;
    const userId = req.user!.id;

    if (!courseIds?.length) throw new AppError('No courses selected', 400);

    // Check already enrolled
    const enrolled = await prisma.enrollment.findMany({
      where: { userId, courseId: { in: courseIds } },
    });
    if (enrolled.length > 0) {
      throw new AppError('Already enrolled in one or more courses', 409);
    }

    // Get courses & calculate total
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds }, isPublished: true },
    });
    if (courses.length !== courseIds.length) throw new AppError('One or more courses not found', 404);

    const totalAmount = courses.reduce((sum, c) => sum + c.price, 0);

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        paymentMethod: paymentMethod as any,
        items: {
          create: courses.map(c => ({ courseId: c.id, price: c.price })),
        },
      },
    });

    // Generate payment URL
    if (paymentMethod === 'VNPAY') {
      const paymentUrl = createVNPayUrl(order.id, totalAmount, req.ip || '127.0.0.1');
      return res.json({ orderId: order.id, paymentUrl });
    }

    if (paymentMethod === 'STRIPE') {
      const session = await createStripeSession(order.id, courses);
      return res.json({ orderId: order.id, paymentUrl: session.url });
    }

    res.json({ orderId: order.id });
  } catch (err) { next(err); }
};

export const vnpayReturn = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { isValid, orderId } = verifyVNPayReturn(req.query as Record<string, string>);

    if (!isValid) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }

    await fulfillOrder(orderId);
    res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`);
  } catch (err) { next(err); }
};

export const stripeWebhook = async (req: any, res: Response, next: NextFunction) => {
  try {
    const stripe = (await import('../services/stripe.service')).default;
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      await fulfillOrder(session.metadata.orderId);
    }
    res.json({ received: true });
  } catch (err) { next(err); }
};

// Admin: manually grant access
export const grantAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, courseId } = req.body;
    const adminId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!user || !course) throw new AppError('User or course not found', 404);

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, accessGrantedBy: adminId },
      update: { accessGrantedBy: adminId },
    });

    res.json({ message: `Access granted to ${user.name} for ${course.title}` });
  } catch (err) { next(err); }
};

export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { items: { include: { course: { select: { title:true, thumbnail:true, slug:true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) { next(err); }
};

// Internal helper
async function fulfillOrder(orderId: string) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID', paidAt: new Date() },
    include: { items: true, user: true },
  });

  // Create enrollments
  for (const item of order.items) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: order.userId, courseId: item.courseId } },
      create: { userId: order.userId, courseId: item.courseId },
      update: {},
    });
  }

  // Send confirmation email
  sendPurchaseConfirmEmail(order.user.email, order.user.name, order).catch(console.error);
}
