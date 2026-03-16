// src/routes/course.routes.ts
import { Router } from 'express';
import { getCourses, getCourseBySlug, markLessonComplete } from '../controllers/course.controller';
import { authenticate } from '../middleware/auth.middleware';
import prisma from '../db/prisma';

const router = Router();

// GET /courses/categories — public
router.get('/categories', async (_req, res, next) => {
  try {
    const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(cats);
  } catch (err) { next(err); }
});

router.get('/', authenticate as any, getCourses as any);
router.get('/:slug', authenticate as any, getCourseBySlug as any);
router.patch('/lessons/:lessonId/complete', authenticate as any, markLessonComplete as any);

export default router;