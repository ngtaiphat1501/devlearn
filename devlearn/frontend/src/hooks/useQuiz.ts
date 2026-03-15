// src/hooks/useQuiz.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useQuiz = (courseId: string) => {
  return useQuery({
    queryKey: ['quiz', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/quiz/course/${courseId}`);
      return data;
    },
    enabled: !!courseId,
  });
};

export const useSubmitQuiz = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, answers }: { quizId: string; answers: number[] }) =>
      api.post(`/quiz/${quizId}/submit`, { answers }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useCertificate = (courseId: string) => {
  return useQuery({
    queryKey: ['certificate', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/quiz/certificate/${courseId}`);
      return data;
    },
    enabled: !!courseId,
    retry: false,
  });
};
