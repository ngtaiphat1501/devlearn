// src/routes/admin.routes.ts
import { Router } from 'express';
import {
  getDashboardStats, getUsers, toggleUserStatus,
  getUserEnrollments, toggleCoursePublish,
} from '../controllers/admin.controller';
import { createCourse, updateCourse, deleteCourse } from '../controllers/course.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
const isAdmin = [authenticate as any, requireRole('ADMIN') as any];

router.get('/stats',                   ...isAdmin, getDashboardStats as any);
router.get('/users',                   ...isAdmin, getUsers as any);
router.patch('/users/:id/toggle',      ...isAdmin, toggleUserStatus as any);
router.get('/users/:id/enrollments',   ...isAdmin, getUserEnrollments as any);
router.patch('/courses/:id/toggle',    ...isAdmin, toggleCoursePublish as any);
router.post('/courses',                ...isAdmin, createCourse as any);
router.patch('/courses/:id',           ...isAdmin, updateCourse as any);
router.delete('/courses/:id',          ...isAdmin, deleteCourse as any);

export default router;