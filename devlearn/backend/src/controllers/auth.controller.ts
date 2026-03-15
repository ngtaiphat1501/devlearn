// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { sendWelcomeEmail } from '../services/email.service';

const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new AppError('Email already in use', 409);

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id:true, name:true, email:true, role:true, avatar:true },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    // Send welcome email (fire & forget)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user, accessToken });
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: { id:user.id, name:user.name, email:user.email, role:user.role, avatar:user.avatar },
      accessToken,
    });
  } catch (err) { next(err); }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError('No refresh token', 401);

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.refreshToken !== token) throw new AppError('Invalid refresh token', 401);

    const { accessToken, refreshToken: newRefresh } = generateTokens(user.id, user.email, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefresh } });

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (err) { next(err); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string };
      await prisma.user.update({ where: { id: payload.id }, data: { refreshToken: null } }).catch(() => {});
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
};

export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id:true, name:true, email:true, role:true, avatar:true, createdAt:true },
    });
    res.json(user);
  } catch (err) { next(err); }
};
