// src/routes/course.routes.ts
import { Router } from 'express';
import { getCourses, getCourseBySlug, markLessonComplete } from '../controllers/course.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate as any, getCourses as any);
router.get('/:slug', authenticate as any, getCourseBySlug as any);
router.patch('/lessons/:lessonId/complete', authenticate as any, markLessonComplete as any);

export default router;
