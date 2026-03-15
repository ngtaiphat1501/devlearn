// src/controllers/admin.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../db/prisma';
import { AppError } from '../middleware/error.middleware';

export const getDashboardStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalCourses, totalOrders, revenue] = await Promise.all([
      prisma.user.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true } }),
    ]);

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: { status: 'PAID' },
      take: 5,
      orderBy: { paidAt: 'desc' },
      include: { user: { select: { name:true, email:true } }, items: { include: { course: { select: { title:true } } } } },
    });

    // Revenue by course
    const revenueByCourse = await prisma.orderItem.groupBy({
      by: ['courseId'],
      _sum: { price: true },
      _count: { courseId: true },
    });

    const courseNames = await prisma.course.findMany({
      where: { id: { in: revenueByCourse.map(r => r.courseId) } },
      select: { id:true, title:true },
    });

    const revenueData = revenueByCourse.map(r => ({
      courseId: r.courseId,
      title: courseNames.find(c => c.id === r.courseId)?.title,
      revenue: r._sum.price,
      orders: r._count.courseId,
    }));

    res.json({
      totalUsers, totalCourses, totalOrders,
      totalRevenue: revenue._sum.totalAmount || 0,
      recentOrders, revenueData,
    });
  } catch (err) { next(err); }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (search) where.OR = [
      { name:  { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: parseInt(limit),
        select: {
          id:true, name:true, email:true, role:true, isActive:true, createdAt:true,
          _count: { select: { enrollments:true, orders:true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users, total });
  } catch (err) { next(err); }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'ADMIN') throw new AppError('Cannot deactivate admin', 400);
    const updated = await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
    res.json({ isActive: updated.isActive });
  } catch (err) { next(err); }
};

export const getUserEnrollments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: id },
      include: { course: { select: { id:true, title:true, slug:true, thumbnail:true } } },
    });
    res.json(enrollments);
  } catch (err) { next(err); }
};

export const toggleCoursePublish = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) throw new AppError('Course not found', 404);
    const updated = await prisma.course.update({ where: { id }, data: { isPublished: !course.isPublished } });
    res.json({ isPublished: updated.isPublished });
  } catch (err) { next(err); }
};
