// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes     from './routes/auth.routes';
import courseRoutes   from './routes/course.routes';
import userRoutes     from './routes/user.routes';
import orderRoutes    from './routes/order.routes';
import quizRoutes     from './routes/quiz.routes';
import adminRoutes    from './routes/admin.routes';
import uploadRoutes   from './routes/upload.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// ── Security ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many auth requests' });
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ── Body parsing ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health check ──────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/orders',  orderRoutes);
app.use('/api/quiz',    quizRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/upload',  uploadRoutes);

// ── Error handler ─────────────────────────────────
app.use(errorHandler);

export default app;
