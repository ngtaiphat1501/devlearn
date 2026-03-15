// src/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/users/dashboard');
      return data;
    },
  });
};

// src/hooks/useQuiz.ts — inline export below
export {};
