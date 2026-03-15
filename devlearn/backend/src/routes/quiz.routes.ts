// src/routes/quiz.routes.ts
import { Router } from 'express';
import { getQuizByCourse, submitQuiz, getCertificate } from '../controllers/quiz.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/course/:courseId', authenticate as any, getQuizByCourse as any);
router.post('/:quizId/submit', authenticate as any, submitQuiz as any);
router.get('/certificate/:courseId', authenticate as any, getCertificate as any);

export default router;
