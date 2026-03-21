// src/controllers/order.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { createVNPayUrl, verifyVNPayReturn } from '../services/vnpay.service';
import { createStripeSession } from '../services/stripe.service';
import { sendPurchaseConfirmEmail } from '../services/email.service';

// ─────────────────────────────────────────────────────────────
// CREATE ORDER
// ─────────────────────────────────────────────────────────────
export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseIds, paymentMethod = 'VNPAY' } = req.body;
    const userId = req.user!.id;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      throw new AppError('No courses selected', 400);
    }

    // Kiểm tra đã enroll chưa
    const alreadyEnrolled = await prisma.enrollment.findMany({
      where: { userId, courseId: { in: courseIds } },
      select: { courseId: true },
    });
    if (alreadyEnrolled.length > 0) {
      const enrolledIds = alreadyEnrolled.map((e) => e.courseId);
      throw new AppError(
        `Already enrolled in courses: ${enrolledIds.join(', ')}`,
        409
      );
    }

    // Lấy courses và validate
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds }, isPublished: true },
    });
    if (courses.length !== courseIds.length) {
      throw new AppError('One or more courses not found or unpublished', 404);
    }

    const totalAmount = courses.reduce((sum, c) => sum + c.price, 0);

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        paymentMethod: paymentMethod as any,
        items: {
          create: courses.map((c) => ({ courseId: c.id, price: c.price })),
        },
      },
    });

    if (paymentMethod === 'VNPAY') {
      const paymentUrl = createVNPayUrl(
        order.id,
        totalAmount,
        req.ip || '127.0.0.1'
      );
      return res.json({ orderId: order.id, paymentUrl });
    }

    if (paymentMethod === 'STRIPE') {
      const session = await createStripeSession(order.id, courses);
      return res.json({ orderId: order.id, paymentUrl: session.url });
    }

    res.json({ orderId: order.id });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// VNPAY RETURN (redirect sau khi thanh toán)
// ─────────────────────────────────────────────────────────────
export const vnpayReturn = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { isValid, orderId } = verifyVNPayReturn(
      req.query as Record<string, string>
    );

    if (!isValid) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }

    // Idempotency check — VNPay đôi khi gọi return URL 2 lần
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }

    if (order.status !== 'PAID') {
      await fulfillOrder(orderId);
    }

    res.redirect(
      `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// STRIPE WEBHOOK
// ─────────────────────────────────────────────────────────────
export const stripeWebhook = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const stripe = (await import('../services/stripe.service')).default;
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      // Signature invalid — từ chối ngay
      console.error('[Stripe Webhook] Invalid signature:', err.message);
      return res.status(400).json({ error: `Webhook signature error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        console.error('[Stripe Webhook] Missing orderId in metadata', session.id);
        return res.status(400).json({ error: 'Missing orderId in metadata' });
      }

      // ── IDEMPOTENCY CHECK ──────────────────────────────────────
      // Stripe có thể gửi cùng 1 event nhiều lần (retry).
      // Kiểm tra order đã PAID trước khi xử lý để tránh:
      //   - Tạo enrollment 2 lần
      //   - Gửi email 2 lần
      //   - Sai số liệu revenue
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true },
      });

      if (!existingOrder) {
        console.error('[Stripe Webhook] Order not found:', orderId);
        // Trả 200 để Stripe không retry vô ích
        return res.json({ received: true, note: 'Order not found' });
      }

      if (existingOrder.status === 'PAID') {
        // Đã xử lý rồi — trả 200 để Stripe không retry
        return res.json({ received: true, note: 'Already fulfilled' });
      }

      await fulfillOrder(orderId);
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GRANT ACCESS (Admin)
// ─────────────────────────────────────────────────────────────
export const grantAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, courseId } = req.body;
    const adminId = req.user!.id;

    const [user, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true },
      }),
    ]);

    if (!user || !course) {
      throw new AppError('User or course not found', 404);
    }

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, accessGrantedBy: adminId },
      update: { accessGrantedBy: adminId },
    });

    res.json({
      message: `Access granted to "${user.name}" for "${course.title}"`,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// MY ORDERS
// ─────────────────────────────────────────────────────────────
export const getMyOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: {
            course: {
              select: { title: true, thumbnail: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// INTERNAL HELPER — fulfillOrder
// Dùng Prisma $transaction để atomic:
//   1. Update order status → PAID
//   2. Tạo tất cả enrollments
// Nếu bất kỳ bước nào fail → toàn bộ rollback
// ─────────────────────────────────────────────────────────────
async function fulfillOrder(orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Mark order PAID
    const order = await tx.order.update({
      where: { id: orderId },
      data: { status: 'PAID', paidAt: new Date() },
      include: {
        items: true,
        user: { select: { email: true, name: true } },
      },
    });

    // 2. Tạo enrollments (upsert để safe với concurrent requests)
    await Promise.all(
      order.items.map((item) =>
        tx.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: order.userId,
              courseId: item.courseId,
            },
          },
          create: { userId: order.userId, courseId: item.courseId },
          update: {}, // Không cần update gì nếu đã tồn tại
        })
      )
    );

    // 3. Gửi email — ngoài transaction vì email fail không nên rollback payment
    //    Dùng setImmediate để không block response
    setImmediate(() => {
      sendPurchaseConfirmEmail(order.user.email, order.user.name, order).catch(
        (err) => {
          // Log để debug nhưng không throw
          console.error(
            `[Email] Failed to send purchase confirm to ${order.user.email}:`,
            err.message
          );
        }
      );
    });
  });
}