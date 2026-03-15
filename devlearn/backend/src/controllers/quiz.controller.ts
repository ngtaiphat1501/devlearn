// src/controllers/quiz.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { v4 as uuid } from 'uuid';

export const getQuizByCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.id;

    // Must be enrolled
    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrolled) throw new AppError('Enroll in this course to take the quiz', 403);

    const quiz = await prisma.quiz.findFirst({
      where: { courseId },
      include: {
        questions: { orderBy: { position: 'asc' } },
      },
    });
    if (!quiz) throw new AppError('No quiz for this course', 404);

    // Last attempt
    const lastAttempt = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: quiz.id },
      orderBy: { createdAt: 'desc' },
    });

    // Strip correct answers from response
    const sanitized = {
      ...quiz,
      questions: quiz.questions.map(q => ({
        id: q.id, question: q.question, codeSnippet: q.codeSnippet,
        options: q.options, position: q.position,
        // answer not sent to client
      })),
      lastAttempt,
    };

    res.json(sanitized);
  } catch (err) { next(err); }
};

export const submitQuiz = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // array of selected option indices
    const userId = req.user!.id;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { position: 'asc' } }, course: true },
    });
    if (!quiz) throw new AppError('Quiz not found', 404);

    // Verify enrollment
    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: quiz.courseId } },
    });
    if (!enrolled) throw new AppError('Not enrolled', 403);

    if (answers.length !== quiz.questions.length) {
      throw new AppError('Answer all questions', 400);
    }

    // Score
    let correct = 0;
    const results = quiz.questions.map((q, i) => {
      const isCorrect = answers[i] === q.answer;
      if (isCorrect) correct++;
      return { questionId: q.id, selected: answers[i], correct: q.answer, isCorrect };
    });

    const total = quiz.questions.length;
    const passed = correct / total >= 0.75;

    const attempt = await prisma.quizAttempt.create({
      data: { userId, quizId, answers, score: correct, total, passed },
    });

    // Issue certificate if passed (upsert = only one cert per course)
    let certificate = null;
    if (passed) {
      certificate = await prisma.certificate.upsert({
        where: { userId_courseId: { userId, courseId: quiz.courseId } },
        create: {
          userId, courseId: quiz.courseId,
          code: `DL-${Date.now().toString(36).toUpperCase()}-${uuid().slice(0,6).toUpperCase()}`,
          score: correct, total,
        },
        update: { score: correct, total, issuedAt: new Date() },
      });
    }

    res.json({ attempt, results, passed, correct, total, certificate });
  } catch (err) { next(err); }
};

export const getCertificate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const cert = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId: req.user!.id, courseId } },
      include: {
        course: { select: { title:true, level:true } },
        user:   { select: { name:true } },
      },
    });
    if (!cert) throw new AppError('Certificate not found', 404);
    res.json(cert);
  } catch (err) { next(err); }
};
