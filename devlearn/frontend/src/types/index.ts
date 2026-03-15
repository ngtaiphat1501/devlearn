// src/types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'INSTRUCTOR' | 'ADMIN';
  avatar?: string | null;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDesc: string;
  thumbnail?: string | null;
  previewVideo?: string | null;
  price: number;
  oldPrice?: number | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tags: string[];
  isPublished: boolean;
  totalLessons: number;
  totalMinutes: number;
  category: Category;
  instructor: { id: string; name: string; avatar?: string | null };
  enrollmentCount?: number;
  isOwned?: boolean;
  sections?: Section[];
  quizzes?: Quiz[];
  userProgress?: Record<string, boolean>;
  createdAt: string;
}

export interface Section {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: number;
  isFree: boolean;
  position: number;
  videoUrl?: string | null;
}

export interface Quiz {
  id: string;
  courseId: string;
  questions: QuizQuestion[];
  lastAttempt?: QuizAttempt | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string | null;
  options: string[];
  position: number;
}

export interface QuizAttempt {
  id: string;
  score: number;
  total: number;
  passed: boolean;
  createdAt: string;
}

export interface Certificate {
  id: string;
  code: string;
  score: number;
  total: number;
  issuedAt: string;
  course: { title: string; level: string };
  user: { name: string };
}

export interface Order {
  id: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'VNPAY' | 'STRIPE' | 'MANUAL';
  paidAt?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  price: number;
  course: { title: string; thumbnail?: string | null; slug: string };
}

export interface DashboardEnrollment {
  enrollment: { createdAt: string };
  course: Course;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  lastQuizAttempt: QuizAttempt | null;
  certificate: Certificate | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: any[];
  revenueData: any[];
}
