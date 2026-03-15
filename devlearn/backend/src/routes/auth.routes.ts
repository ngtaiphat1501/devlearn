// src/routes/auth.routes.ts
import { Router } from 'express';
import { register, login, refreshToken, logout, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  ],
  validate,
  register
);
router.post('/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  validate,
  login
);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
