// src/controllers/course.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../db/prisma';
import { AppError } from '../middleware/error.middleware';

export const getCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category, level, search, page = '1', limit = '12' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { isPublished: true };
    if (category) where.category = { slug: category };
    if (level) where.level = level.toUpperCase();
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where, skip, take: parseInt(limit),
        include: {
          category: { select: { name:true, slug:true } },
          instructor: { select: { name:true, avatar:true } },
          _count: { select: { enrollments:true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    let ownedIds: string[] = [];
    if (req.user) {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: req.user.id },
        select: { courseId: true },
      });
      ownedIds = enrollments.map(e => e.courseId);
    }

    const data = courses.map(c => ({
      ...c,
      enrollmentCount: c._count.enrollments,
      isOwned: ownedIds.includes(c.id),
    }));

    res.json({ data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

export const getCourseBySlug = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        instructor: { select: { id:true, name:true, avatar:true } },
        sections: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              select: { id:true, title:true, duration:true, isFree:true, position:true },
            },
          },
        },
        quizzes: { include: { _count: { select: { questions: true } } } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) throw new AppError('Course not found', 404);

    let isOwned = false;
    let userProgress: Record<string, boolean> = {};
    if (req.user) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      });
      isOwned = !!enrollment;
      if (isOwned) {
        const progress = await prisma.lessonProgress.findMany({
          where: { userId: req.user.id, lesson: { section: { courseId: course.id } } },
        });
        progress.forEach(p => { userProgress[p.lessonId] = p.completed; });
      }
    }

    res.json({ ...course, isOwned, userProgress, enrollmentCount: course._count.enrollments });
  } catch (err) { next(err); }
};

export const markLessonComplete = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user!.id;

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { section: true } });
    if (!lesson) throw new AppError('Lesson not found', 404);

    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.section.courseId } },
    });
    if (!enrolled) throw new AppError('Not enrolled in this course', 403);

    const progress = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, completed: true, completedAt: new Date() },
      update: { completed: true, completedAt: new Date() },
    });

    res.json(progress);
  } catch (err) { next(err); }
};

export const createCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, shortDesc, description, price, oldPrice, level, tags, thumbnail, slug, categoryId } = req.body;
    const course = await prisma.course.create({
      data: {
        title, shortDesc, description,
        price: Number(price), oldPrice: Number(oldPrice || 0),
        level, tags: tags || [], thumbnail: thumbnail || '',
        slug: slug || title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        instructorId: req.user!.id,
        categoryId: categoryId || '',
        isPublished: false,
      },
    });
    res.json({ course });
  } catch (err) { next(err); }
};

export const updateCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, shortDesc, description, price, oldPrice, level, tags, thumbnail, isPublished } = req.body;
    const course = await prisma.course.update({
      where: { id },
      data: { title, shortDesc, description, price: Number(price), oldPrice: Number(oldPrice || 0), level, tags, thumbnail, isPublished },
    });
    res.json({ course });
  } catch (err) { next(err); }
};

export const deleteCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    res.json({ message: 'Đã xóa khóa học' });
  } catch (err) { next(err); }
};