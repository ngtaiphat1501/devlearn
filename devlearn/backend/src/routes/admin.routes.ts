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
// ── Quiz ──────────────────────────────────────────────────
router.post('/courses/:id/quiz', ...isAdmin, async (req: any, res: any, next: any) => {
  try {
    const existing = await prisma.quiz.findFirst({ where: { courseId: req.params.id } });
    if (existing) return res.json(existing);
    const quiz = await prisma.quiz.create({ data: { courseId: req.params.id } });
    res.json(quiz);
  } catch (err) { next(err); }
});

router.post('/courses/:id/quiz/questions', ...isAdmin, async (req: any, res: any, next: any) => {
  try {
    let quiz = await prisma.quiz.findFirst({ where: { courseId: req.params.id } });
    if (!quiz) quiz = await prisma.quiz.create({ data: { courseId: req.params.id } });
    const { question, codeSnippet, options, answer, position } = req.body;
    const q = await prisma.quizQuestion.create({
      data: { quizId: quiz.id, question, codeSnippet: codeSnippet || null, options, answer: Number(answer), position: Number(position) || 1 },
    });
    res.status(201).json(q);
  } catch (err) { next(err); }
});

router.get('/courses/:id/quiz', ...isAdmin, async (req: any, res: any, next: any) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id }, select: { title: true } });
    const quiz = await prisma.quiz.findFirst({
      where: { courseId: req.params.id },
      include: { questions: { orderBy: { position: 'asc' } } },
    });
    res.json({ courseTitle: course?.title, questions: quiz?.questions || [], quizId: quiz?.id });
  } catch (err) { next(err); }
});

router.patch('/quiz-questions/:id', ...isAdmin, async (req: any, res: any, next: any) => {
  try {
    const { question, codeSnippet, options, answer } = req.body;
    const q = await prisma.quizQuestion.update({
      where: { id: req.params.id },
      data: { question, codeSnippet: codeSnippet || null, options, answer: Number(answer) },
    });
    res.json(q);
  } catch (err) { next(err); }
});

router.delete('/quiz-questions/:id', ...isAdmin, async (req: any, res: any, next: any) => {
  try {
    await prisma.quizQuestion.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});
export default router;