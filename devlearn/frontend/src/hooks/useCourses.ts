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
    mutationFn: (lessonId: string) => api.patch(`/courses/lessons/${lessonId}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
  });
};
