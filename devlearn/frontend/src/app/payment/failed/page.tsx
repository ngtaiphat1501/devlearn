// src/app/payment/failed/page.tsx
'use client';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

export default function PaymentFailed() {
  return (
    <>
      <Navbar />
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-card border border-border2 rounded-[18px] p-10 text-center max-w-md w-full">
          <div className="text-[56px] mb-4">❌</div>
          <h1 className="text-[22px] font-bold mb-2">Thanh toán thất bại</h1>
          <p className="text-[13px] text-[#94a3b8] mb-6">
            Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/courses" className="btn-primary">Thử lại</Link>
            <Link href="/" className="btn-secondary">Về trang chủ</Link>
          </div>
        </div>
      </div>
    </>
  );
}
