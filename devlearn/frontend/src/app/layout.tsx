// src/app/layout.tsx
import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/components/layout/Providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: { default: 'DevLearn — Nền tảng học lập trình', template: '%s | DevLearn' },
  description: 'Học lập trình từ chuyên gia. Python, React, DevOps, ML — khóa học thực chiến với chứng chỉ.',
  keywords: ['học lập trình', 'khóa học online', 'Python', 'React', 'DevOps'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#16161f',
                color: '#e2e8f0',
                border: '1px solid #2a2a3d',
                borderRadius: '10px',
                fontSize: '13px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
