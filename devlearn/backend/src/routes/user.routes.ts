// src/routes/user.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import prisma from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import bcrypt from 'bcryptjs';

const router = Router();

// GET /api/users/dashboard — enrolled courses + progress
router.get('/dashboard', authenticate as any, async (req: any, res, next) => {
  try {
    const userId = req.user.id;
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            sections: {
              include: { lessons: { select: { id: true } } },
            },
            quizzes: true,
          },
        },
      },
    });

    const data = await Promise.all(enrollments.map(async (en) => {
      const totalLessons = en.course.sections.reduce((s, sec) => s + sec.lessons.length, 0);
      const lessonIds = en.course.sections.flatMap(sec => sec.lessons.map(l => l.id));
      const completed = await prisma.lessonProgress.count({
        where: { userId, lessonId: { in: lessonIds }, completed: true },
      });
      const lastAttempt = en.course.quizzes[0]
        ? await prisma.quizAttempt.findFirst({
            where: { userId, quizId: en.course.quizzes[0].id },
            orderBy: { createdAt: 'desc' },
          })
        : null;
      const cert = await prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId: en.course.id } },
      });
      return {
        enrollment: en,
        totalLessons,
        completedLessons: completed,
        progressPct: totalLessons ? Math.round((completed / totalLessons) * 100) : 0,
        lastQuizAttempt: lastAttempt,
        certificate: cert,
      };
    }));

    const totalCerts = await prisma.certificate.count({ where: { userId } });
    res.json({ enrollments: data, totalCerts });
  } catch (err) { next(err); }
});

// PATCH /api/users/profile
router.patch('/profile', authenticate as any, async (req: any, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, avatar },
      select: { id:true, name:true, email:true, role:true, avatar:true },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /api/users/password
router.patch('/password', authenticate as any, async (req: any, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new AppError('User not found', 404);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError('Current password incorrect', 400);
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

export default router;
