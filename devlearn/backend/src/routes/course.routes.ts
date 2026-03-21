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
              select: { id: true, title: true, duration: true, isFree: true, videoUrl: true, description: true },
            },
          },
        },
        quizzes: { select: { id: true }, take: 1 },
      },
    });
    if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    if (req.user.role !== 'ADMIN') {
      const enrollment = await prisma.enrollment.findFirst({ where: { userId, courseId: course.id } });
      if (!enrollment) return res.status(403).json({ message: 'Bạn chưa đăng ký khóa học này' });
    }
    const progress = await prisma.lessonProgress.findMany({
      where: { userId, lesson: { section: { courseId: course.id } } },
      select: { lessonId: true, completed: true },
    });
    const completedSet = new Set(progress.filter((p: any) => p.completed).map((p: any) => p.lessonId));
    const sectionsWithProgress = course.sections.map((sec: any) => ({
      ...sec,
      lessons: sec.lessons.map((l: any) => ({ ...l, isCompleted: completedSet.has(l.id) })),
    }));
    res.json({ id: course.id, title: course.title, slug: course.slug, sections: sectionsWithProgress, hasQuiz: course.quizzes.length > 0 });
  } catch (err) { next(err); }
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
  } catch (err) { next(err); }
});

// ── Quiz cho học viên ─────────────
// ────────────────────────────────────

// ── Quiz admin ────────────────────────────────────────────────────────
router.post('/:id/quiz', authenticate as any, async (req: any, res: any, next: any) => {
  try {
    const existing = await prisma.quiz.findFirst({ where: { courseId: req.params.id } });
    if (existing) { res.json({ quiz: existing }); return; }
    const quiz = await prisma.quiz.create({ data: { courseId: req.params.id } });
    res.json({ quiz });
  } catch (err) { next(err); }
});

router.post('/:id/quiz/questions', authenticate as any, async (req: any, res: any, next: any) => {
  try {
    const quiz = await prisma.quiz.findFirst({ where: { courseId: req.params.id } });
    if (!quiz) { res.status(404).json({ message: 'Quiz not found' }); return; }
    const { question, codeSnippet, options, answer, position } = req.body;
    const q = await prisma.quizQuestion.create({
      data: { quizId: quiz.id, question, codeSnippet: codeSnippet || null, options, answer, position: position || 1 },
    });
    res.json({ question: q });
  } catch (err) { next(err); }
});

router.patch('/:id/quiz/questions/:qId', authenticate as any, async (req: any, res: any, next: any) => {
  try {
    const { question, codeSnippet, options, answer } = req.body;
    const q = await prisma.quizQuestion.update({
      where: { id: req.params.qId },
      data: { question, codeSnippet, options, answer },
    });
    res.json({ question: q });
  } catch (err) { next(err); }
});

router.delete('/:id/quiz/questions/:qId', authenticate as any, async (req: any, res: any, next: any) => {
  try {
    await prisma.quizQuestion.delete({ where: { id: req.params.qId } });
    res.json({ message: 'Đã xóa' });
  } catch (err) { next(err); }
});



router.get('/:id/quiz', authenticate as any, async (req: any, res: any, next: any) => {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: { courseId: req.params.id },
      include: { questions: { orderBy: { position: 'asc' } } },
    });
    if (!quiz) return res.status(404).json({ message: 'Chưa có quiz' });
    res.json(quiz);
  } catch (err) { next(err); }
});

router.post('/:id/quiz/submit', authenticate as any, async (req: any, res: any, next: any) => {
  try {
    const { answers } = req.body;
    const userId = req.user.id;
    const courseId = req.params.id;
    const quiz = await prisma.quiz.findFirst({ where: { courseId }, include: { questions: true } });
    if (!quiz) return res.status(404).json({ message: 'Không tìm thấy quiz' });
    let score = 0;
    quiz.questions.forEach((q: any, i: number) => { if (answers[i] === q.answer) score++; });
    const total = quiz.questions.length;
    const passed = total > 0 && score / total >= 0.75;
    await prisma.quizAttempt.create({ data: { userId, quizId: quiz.id, answers, score, total, passed } });
    if (passed) {
      await prisma.certificate.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId, code: `CERT-${Date.now()}`, score, total },
        update: { score, total },
      });
    }
    res.json({ score, total, passed });
  } catch (err) { next(err); }
});

// ── Course detail by slug (phải để cuối) ─────────────────────────────
router.get('/:slug', authenticate as any, getCourseBySlug as any);

export default router;