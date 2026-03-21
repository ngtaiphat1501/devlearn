// src/hooks/useCourses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Course, PaginatedResponse } from '@/types';

interface CourseFilters {
  category?: string;
  level?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const useCourses = (filters: CourseFilters = {}) => {
  return useQuery<PaginatedResponse<Course>>({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const { data } = await api.get('/courses', { params: filters });
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useCourse = (slug: string) => {
  return useQuery<Course>({
    queryKey: ['course', slug],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
};

export const useMarkLessonComplete = () => {
  const qc = useQueryClient();
  return useMutation({
    // FIX: Backend mount tại /api/courses → /courses/lessons/:id/complete
    // Trước đây dùng PATCH, route mới dùng POST để nhất quán với REST
    mutationFn: (lessonId: string) =>
      api.post(`/courses/lessons/${lessonId}/complete`),
    onSuccess: (_data, lessonId) => {
      // Invalidate dashboard để cập nhật progress
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate course detail nếu đang ở trang course
      qc.invalidateQueries({ queryKey: ['course'] });
    },
  });
};