// src/components/course/PaymentModal.tsx
'use client';
import { useState } from 'react';
import { Course } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCreateOrder } from '@/hooks/useOrder';
import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  course: Course | null;
  onClose: () => void;
}

const METHODS = [
  { id: 'VNPAY',  label: 'VNPay',        icon: '🔵', info: 'Chuyển khoản qua cổng VNPay.\nHỗ trợ mọi ngân hàng Việt Nam.' },
  { id: 'STRIPE', label: 'Visa/Master',   icon: '💳', info: 'Thanh toán bằng thẻ quốc tế Visa / Mastercard qua Stripe.' },
];

export function PaymentModal({ course, onClose }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [method, setMethod] = useState('VNPAY');
  const { mutate: createOrder, isPending } = useCreateOrder();

  if (!course) return null;

  const handlePay = () => {
    if (!user) { router.push('/auth/login'); return; }
    createOrder(
      { courseIds: [course.id], paymentMethod: method },
      {
        onSuccess: (data) => {
          if (data.paymentUrl) window.location.href = data.paymentUrl;
          else toast.success('Đã mở quyền truy cập!');
          onClose();
        },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Lỗi thanh toán'),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-[999] flex items-center justify-center p-4">
      <div className="bg-surface border border-border2 rounded-[18px] p-7 w-full max-w-[420px] relative animate-[mUp_0.3s_ease]">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-[#1e1e2e] border border-border2 rounded-[7px] flex items-center justify-center text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
          <X size={14} />
        </button>

        <h2 className="text-[19px] font-bold mb-1">Thanh toán</h2>
        <p className="text-[13px] text-[#94a3b8] mb-5">{course.title}</p>

        {/* Order summary */}
        <div className="flex justify-between items-center px-3.5 py-3 bg-bg border border-border rounded-[9px] mb-5">
          <span className="text-[13px] text-[#94a3b8]">Tổng thanh toán</span>
          <span className="font-mono text-[19px] font-medium text-acc">{formatPrice(course.price)}</span>
        </div>

        {/* Payment methods */}
        <p className="label mb-2">Phương thức thanh toán</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`border rounded-[9px] p-3 text-center transition-all ${
                method === m.id
                  ? 'border-acc bg-[rgba(0,212,255,0.06)] text-acc'
                  : 'border-border2 text-[#94a3b8] hover:border-acc hover:text-acc'
              }`}
            >
              <span className="text-[22px] block mb-1">{m.icon}</span>
              <span className="text-[13px] font-medium">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-bg border border-border rounded-[9px] px-3.5 py-3 text-[12px] text-[#94a3b8] font-mono leading-relaxed mb-4 whitespace-pre-line">
          {METHODS.find((m) => m.id === method)?.info}
        </div>

        <button onClick={handlePay} disabled={isPending} className="btn-primary w-full py-3 text-[14px]">
          {isPending ? 'Đang xử lý...' : '✓ Xác nhận thanh toán'}
        </button>
        <p className="text-center text-[11px] text-[#64748b] font-mono mt-2.5">
          // Bạn sẽ được chuyển đến cổng thanh toán an toàn
        </p>
      </div>
    </div>
  );
}
