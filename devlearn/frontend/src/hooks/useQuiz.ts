// src/hooks/useQuiz.ts
//
// FRONTEND: devlearn/frontend/src/hooks/useQuiz.ts
//
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Lấy quiz theo courseId (không phải quizId)
export const useQuiz = (courseId: string) => {
  return useQuery({
    queryKey: ['quiz', courseId],
    queryFn: async () => {
      // FIX: /courses/:courseId/quiz (dùng courseId)
      // Không dùng /quiz/course/:courseId nữa vì route đã đổi
      const { data } = await api.get(`/courses/${courseId}/quiz`);
      return data;
    },
    enabled: !!courseId,
  });
};

// Submit quiz — dùng courseId + answers
export const useSubmitQuiz = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      answers,
    }: {
      courseId: string;
      answers: number[];
    }) =>
      // FIX: /courses/:courseId/quiz/submit (dùng courseId)
      // Trước đây dùng /quiz/:quizId/submit → sai endpoint sau khi refactor routes
      api
        .post(`/courses/${courseId}/quiz/submit`, { answers })
        .then((r) => r.data),
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
