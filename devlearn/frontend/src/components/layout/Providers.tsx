// src/components/layout/Providers.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import Cookies from 'js-cookie';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const { fetchMe, accessToken } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const token = accessToken || Cookies.get('accessToken');
      if (token) fetchMe();
    }
  }, []);

  return (
    <QueryClientProvider client={qc}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
