// src/routes/course.routes.ts
//
// ⚠️  PRODUCTION CRITICAL: Thứ tự route quan trọng.
//     Express match route từ trên xuống dưới.
//     Route có /:param PHẢI đứng SAU route static cùng prefix.
//
// Thứ tự đúng:
//   1. /categories                   → static, không param
//   2. /lessons/:lessonId/...        → static "lessons" trước /:slug
//   3. /:id/manage                   → admin, dùng id (UUID format)
//   4. /:id/sections/...             → admin CRUD
//   5. /:slug/learn                  → học viên học bài
//   6. /:slug/quiz + /:slug/quiz/... → quiz operations
//   7. /:slug                        → ← LUÔN ĐỂ CUỐI
//
import { Router } from 'express';
import prisma from '../db/prisma';
import {
  getCourses,
  getCourseBySlug,
  getCourseById,
  markLessonComplete,
  getCategories,
  addSection,
  addLesson,
  deleteSection,
  deleteLesson,
  updateLesson,
} from '../controllers/course.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// STATIC ROUTES (không có :param)
// ═══════════════════════════════════════════════════════════════

router.get('/categories', getCategories as any);

// ═══════════════════════════════════════════════════════════════
// LESSON ROUTES — prefix "lessons" tránh conflict với /:slug
// ═══════════════════════════════════════════════════════════════

// PATCH /courses/lessons/:lessonId/complete
// Dùng bởi: useMarkLessonComplete() hook, trang học bài
router.patch(
  '/lessons/:lessonId/complete',
  authenticate as any,
  markLessonComplete as any
);

// ═══════════════════════════════════════════════════════════════
// COURSE LIST (authenticated)
// ═══════════════════════════════════════════════════════════════

router.get('/', authenticate as any, getCourses as any);

// ═══════════════════════════════════════════════════════════════
// ADMIN — Course & Content Management (by courseId UUID)
// ═══════════════════════════════════════════════════════════════

// GET /courses/:id/manage  — admin lấy chi tiết kèm sections/lessons
router.get('/:id/manage', authenticate as any, getCourseById as any);

// Section CRUD
router.post('/:id/sections', authenticate as any, addSection as any);
router.delete('/:id/sections/:sectionId', authenticate as any, deleteSection as any);

// Lesson CRUD
router.post(
  '/:id/sections/:sectionId/lessons',
  authenticate as any,
  addLesson as any
);
router.patch(
  '/:id/sections/:sectionId/lessons/:lessonId',
  authenticate as any,
  updateLesson as any
);
router.delete(
  '/:id/sections/:sectionId/lessons/:lessonId',
  authenticate as any,
  deleteLesson as any
);

// ═══════════════════════════════════════════════════════════════
// LEARN ROUTE — Student learning experience
// ═══════════════════════════════════════════════════════════════

router.get(
  '/:slug/learn',
  authenticate as any,
  async (req: any, res: any, next: any) => {
    try {
      const { slug } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

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

      if (!course) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học' });
      }

      // Admin bypass enrollment check
      if (userRole !== 'ADMIN') {
        const enrollment = await prisma.enrollment.findFirst({
          where: { userId, courseId: course.id },
        });
        if (!enrollment) {
          return res
            .status(403)
            .json({ message: 'Bạn chưa đăng ký khóa học này' });
        }
      }

      // Lấy progress của user cho tất cả lessons trong course này
      const progressRecords = await prisma.lessonProgress.findMany({
        where: {
          userId,
          lesson: { section: { courseId: course.id } },
        },
        select: { lessonId: true, completed: true },
      });

      const completedSet = new Set(
        progressRecords
          .filter((p: any) => p.completed)
          .map((p: any) => p.lessonId)
      );

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
  }
);

// POST /courses/lessons/:lessonId/complete  (dùng từ learn page mới)
router.post(
  '/lessons/:lessonId/complete',
  authenticate as any,
  async (req: any, res: any, next: any) => {
    try {
      const { lessonId } = req.params;
      const userId = req.user.id;

      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        create: { userId, lessonId, completed: true, completedAt: new Date() },
        update: { completed: true, completedAt: new Date() },
      });

      res.json({ message: 'OK' });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// QUIZ ROUTES (Student)
// ═══════════════════════════════════════════════════════════════

// GET /courses/:id/quiz  — lấy quiz (student, không có đáp án)
router.get(
  '/:id/quiz',
  authenticate as any,
  async (req: any, res: any, next: any) => {
    try {
      const quiz = await prisma.quiz.findFirst({
        where: { courseId: req.params.id },
        include: {
          questions: {
            orderBy: { position: 'asc' },
            // Ẩn answer khỏi response trả về client
            select: {
              id: true,
              question: true,
              codeSnippet: true,
              options: true,
              position: true,
              // answer: false ← KHÔNG select
            },
          },
        },
      });

      if (!quiz) {
        return res.status(404).json({ message: 'Chưa có quiz cho khóa học này' });
      }

      res.json(quiz);
    } catch (err) {
      next(err);
    }
  }
);

// POST /courses/:id/quiz/submit
router.post(
  '/:id/quiz/submit',
  authenticate as any,
  async (req: any, res: any, next: any) => {
    try {
      const { answers } = req.body;
      const userId = req.user.id;
      const courseId = req.params.id;

      if (!Array.isArray(answers)) {
        return res.status(400).json({ message: 'answers phải là array' });
      }

      const quiz = await prisma.quiz.findFirst({
        where: { courseId },
        include: { questions: { orderBy: { position: 'asc' } } },
      });

      if (!quiz) {
        return res.status(404).json({ message: 'Không tìm thấy quiz' });
      }

      if (answers.length !== quiz.questions.length) {
        return res.status(400).json({
          message: `Cần ${quiz.questions.length} câu trả lời, nhận được ${answers.length}`,
        });
      }

      let score = 0;
      quiz.questions.forEach((q: any, i: number) => {
        if (answers[i] === q.answer) score++;
      });

      const total = quiz.questions.length;
      const passed = total > 0 && score / total >= 0.75;

      await prisma.quizAttempt.create({
        data: { userId, quizId: quiz.id, answers, score, total, passed },
      });

      if (passed) {
        const certCode = `DL-${Date.now().toString(36).toUpperCase()}-${userId
          .slice(0, 4)
          .toUpperCase()}`;
        await prisma.certificate.upsert({
          where: { userId_courseId: { userId, courseId } },
          create: { userId, courseId, code: certCode, score, total },
          update: { score, total, issuedAt: new Date() },
        });
      }

      res.json({ score, total, passed });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// ADMIN Quiz Management (qua route /courses/:id/quiz/...)
// ═══════════════════════════════════════════════════════════════

router.post(
  '/:id/quiz',
  authenticate as any,
  async (req: any, res: any, next: any) => {
    try {
      const existing = await prisma.quiz.findFirst({
        where: { courseId: req.params.id },
      });
      if (existing) return res.json({ quiz: existing });
      const quiz = await prisma.quiz.create({
        data: { courseId: req.params.id },
      });
      res.json({ quiz });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/quiz/questions',
  authenticate as any,
  async (req: any, res: any, next: any) => {
    try {
      const quiz = await prisma.quiz.findFirst({
        where: { courseId: req.params.id },
      });
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
      const { question, codeSnippet, options, answer, position } = req.body;
      const q = await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          question,
          codeSnippet: codeSnippet || null,
          options,
          answer,
          position: position || 1,
        },
      });
      res.json({ question: q });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id/quiz/questions/:qId',
  authenticate as any,
  async (req: any, res: any, next: any) => {
    try {
      const { question, codeSnippet, options, answer } = req.body;
      const q = await prisma.quizQuestion.update({
        where: { id: req.params.qId },
        data: { question, codeSnippet, options, answer },
      });
      res.json({ question: q });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id/quiz/questions/:qId',
  authenticate as any,
  async (req: any, res: any, next: any) => {
    try {
      await prisma.quizQuestion.delete({ where: { id: req.params.qId } });
      res.json({ message: 'Đã xóa câu hỏi' });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// ⚠️  PHẢI ĐỂ CUỐI — wildcard /:slug sẽ match mọi thứ phía trước
// ═══════════════════════════════════════════════════════════════
router.get('/:slug', authenticate as any, getCourseBySlug as any);

export default router;