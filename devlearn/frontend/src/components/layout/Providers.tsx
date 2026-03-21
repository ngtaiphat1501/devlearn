// src/components/layout/Providers.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Component, ReactNode, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import Cookies from 'js-cookie';

// ─────────────────────────────────────────────────────────────
// QueryClient — singleton, dùng chung toàn app
// ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,      // 1 phút trước khi re-fetch
      retry: 1,               // Thử lại 1 lần nếu fail
      refetchOnWindowFocus: false, // Không re-fetch khi switch tab
    },
    mutations: {
      retry: 0, // Mutations không retry tự động
    },
  },
});

// ─────────────────────────────────────────────────────────────
// Error Boundary — bắt crash React, hiển thị fallback UI
// Quan trọng trên production: không để blank white screen
// ─────────────────────────────────────────────────────────────
interface EBState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  EBState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO production: gửi về Sentry / error tracking
    // Sentry.captureException(error, { extra: info });
    console.error('[AppErrorBoundary]', error.message, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#0a0a0f',
          }}
        >
          <div
            style={{
              background: '#16161f',
              border: '1px solid #2a2a3d',
              borderRadius: '18px',
              padding: '40px 32px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '44px', marginBottom: '16px' }}>⚠️</div>
            <h2
              style={{
                color: '#e2e8f0',
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              Có lỗi xảy ra
            </h2>
            {process.env.NODE_ENV === 'development' && (
              <pre
                style={{
                  background: '#0a0a0f',
                  border: '1px solid #1e1e2e',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '11px',
                  color: '#ef4444',
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  marginBottom: '16px',
                  overflowX: 'auto',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              >
                {this.state.errorMessage}
              </pre>
            )}
            <p
              style={{
                color: '#94a3b8',
                fontSize: '13px',
                marginBottom: '20px',
                lineHeight: 1.6,
              }}
            >
              Vui lòng tải lại trang. Nếu vẫn lỗi, liên hệ support.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                background: '#00d4ff',
                color: '#000',
                border: 'none',
                borderRadius: '9px',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────
// AuthInitializer — restore session khi app load
// Tách ra component riêng để dễ test và không làm nặng Providers
// ─────────────────────────────────────────────────────────────
function AuthInitializer() {
  const { fetchMe, accessToken, setToken } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Chỉ chạy 1 lần khi mount
    if (initialized.current) return;
    initialized.current = true;

    // Ưu tiên token trong store (persist), fallback sang cookie
    const token = accessToken || Cookies.get('accessToken');

    if (!token) return; // Chưa login, không cần fetch

    fetchMe().catch(() => {
      // Token expired hoặc invalid:
      // - store.fetchMe() đã tự clear user & token bên trong
      // - Không cần làm gì thêm, user sẽ được redirect khi
      //   cố access protected route
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ─────────────────────────────────────────────────────────────
// Main Providers export
// ─────────────────────────────────────────────────────────────
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer />
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}