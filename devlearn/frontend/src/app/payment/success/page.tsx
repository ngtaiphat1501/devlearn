// src/app/payment/success/page.tsx
'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';

function PaymentSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  return (
    <>
      <Navbar />
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-card border border-border2 rounded-[18px] p-10 text-center max-w-md w-full">
          <div className="text-[56px] mb-4">🎉</div>
          <h1 className="text-[22px] font-bold mb-2">Thanh toán thành công!</h1>
          <p className="text-[13px] text-[#94a3b8] mb-2">Khóa học đã được mở. Hãy bắt đầu học ngay!</p>
          {orderId && <p className="font-mono text-[11px] text-[#64748b] mb-6">Mã đơn hàng: {orderId}</p>}
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="btn-primary">Vào học ngay →</Link>
            <Link href="/courses" className="btn-secondary">Xem thêm khóa học</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
