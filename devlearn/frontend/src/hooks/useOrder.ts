// src/hooks/useOrder.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: (payload: { courseIds: string[]; paymentMethod: string }) =>
      api.post('/orders', payload).then((r) => r.data),
  });
};

export const useMyOrders = () => {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders/my');
      return data;
    },
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data;
    },
  });
};

export const useAdminUsers = (search = '', page = 1) => {
  return useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: async () => {
      const { data } = await api.get('/admin/users', { params: { search, page } });
      return data;
    },
  });
};

export const useGrantAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId: string; courseId: string }) =>
      api.post('/orders/grant-access', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
};

export const useToggleUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/toggle`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
};
