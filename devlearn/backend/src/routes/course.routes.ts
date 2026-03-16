// src/routes/course.routes.ts
import { Router } from 'express';
import { getCourses, getCourseBySlug, getCourseById, markLessonComplete, getCategories, addSection, addLesson, deleteSection, deleteLesson, updateLesson } from '../controllers/course.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/categories', getCategories as any);
router.get('/', authenticate as any, getCourses as any);
router.get('/:id/manage', authenticate as any, getCourseById as any);
router.patch('/lessons/:lessonId/complete', authenticate as any, markLessonComplete as any);
router.post('/:id/sections', authenticate as any, addSection as any);
router.post('/:id/sections/:sectionId/lessons', authenticate as any, addLesson as any);
router.delete('/:id/sections/:sectionId', authenticate as any, deleteSection as any);
router.delete('/:id/sections/:sectionId/lessons/:lessonId', authenticate as any, deleteLesson as any);
router.patch('/:id/sections/:sectionId/lessons/:lessonId', authenticate as any, updateLesson as any);
router.get('/:slug', authenticate as any, getCourseBySlug as any);

export default router;