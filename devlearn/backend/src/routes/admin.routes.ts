// src/routes/admin.routes.ts
import { Router } from 'express';
import {
  getDashboardStats, getUsers, toggleUserStatus,
  getUserEnrollments, toggleCoursePublish,
} from '../controllers/admin.controller';
import { createCourse, updateCourse, deleteCourse } from '../controllers/course.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import prisma from '../db/prisma';

const router = Router();
const isAdmin = [authenticate as any, requireRole('ADMIN') as any];

// ── Stats & Users ──────────────────────────────────────────
router.get('/stats',                  ...isAdmin, getDashboardStats as any);
router.get('/users',                  ...isAdmin, getUsers as any);
router.patch('/users/:id/toggle',     ...isAdmin, toggleUserStatus as any);
router.get('/users/:id/enrollments',  ...isAdmin, getUserEnrollments as any);

// ── Courses (GET phải đặt TRƯỚC :id để không bị conflict) ──
router.get('/courses', ...isAdmin, async (_req: any, res: any, next: any) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        category: { select: { name: true, slug: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const data = courses.map((c: any) => ({
      ...c,
      enrollmentCount: c._count.enrollments,
    }));
    res.json({ data, total: courses.length });
  } catch (err) { next(err); }
});

router.post('/courses',              ...isAdmin, createCourse as any);
router.patch('/courses/:id/toggle',  ...isAdmin, toggleCoursePublish as any);
router.patch('/courses/:id',         ...isAdmin, updateCourse as any);
router.delete('/courses/:id',        ...isAdmin, deleteCourse as any);

export default router;