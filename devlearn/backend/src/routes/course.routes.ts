// src/routes/course.routes.ts
import { Router } from 'express';
import prisma from '../db/prisma';
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

// ── Learn endpoint ────────────────────────────────────────────────────
router.get('/:slug/learn', authenticate as any, async (req: any, res: any, next: any) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
                duration: true,
                isFree: true,
                videoUrl: true,
                description: true,
              },
            },
          },
        },
        quizzes: { select: { id: true }, take: 1 },
      },
    });

    if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });

    // Kiểm tra quyền truy cập (admin bypass)
    if (req.user.role !== 'ADMIN') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId: course.id },
      });
      if (!enrollment) return res.status(403).json({ message: 'Bạn chưa đăng ký khóa học này' });
    }

    // Lấy tiến độ học
    const progress = await prisma.lessonProgress.findMany({
      where: { userId, lesson: { section: { courseId: course.id } } },
      select: { lessonId: true, completed: true },
    });
    const completedSet = new Set(
      progress.filter((p: any) => p.completed).map((p: any) => p.lessonId)
    );

    // Gắn isCompleted vào từng lesson
    const sectionsWithProgress = course.sections.map((sec: any) => ({
      ...sec,
      lessons: sec.lessons.map((l: any) => ({
        ...l,
        isCompleted: completedSet.has(l.id),
      })),
    }));

    res.json({
      id: course.id,
      title: course.title,
      slug: course.slug,
      sections: sectionsWithProgress,
      hasQuiz: course.quizzes.length > 0,
    });
  } catch (err) {
    next(err);
  }
});

// ── Mark lesson complete ──────────────────────────────────────────────
router.post('/lessons/:lessonId/complete', authenticate as any, async (req: any, res: any, next: any) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, completed: true },
      update: { completed: true, completedAt: new Date() },
    });

    res.json({ message: 'OK' });
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', authenticate as any, getCourseBySlug as any);

export default router;