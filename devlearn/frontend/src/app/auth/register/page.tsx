// src/app/auth/register/page.tsx
'use client';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'next/navigation';
import { Code2 } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Mật khẩu không khớp', path: ['confirm'] });
type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      await registerUser(data.name, data.email, data.password);
      toast.success('Đăng ký thành công! Chào mừng bạn 🎉');
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-acc to-acc2 flex items-center justify-center">
            <Code2 size={17} className="text-black" />
          </div>
          <span className="font-mono text-[17px] font-medium">Dev<span className="text-acc">Learn</span></span>
        </Link>

        <div className="bg-surface border border-border2 rounded-[18px] p-8">
          <h1 className="text-[20px] font-bold mb-1.5">Tạo tài khoản</h1>
          <p className="text-[13px] text-[#94a3b8] mb-6">Miễn phí. Không cần thẻ tín dụng.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Họ & tên</label>
              <input {...register('name')} placeholder="Nguyễn Văn A" className="input" />
              {errors.name && <p className="text-red-400 text-[11px] mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input" />
              {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <input {...register('password')} type="password" placeholder="Tối thiểu 6 ký tự" className="input" />
              {errors.password && <p className="text-red-400 text-[11px] mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Xác nhận mật khẩu</label>
              <input {...register('confirm')} type="password" placeholder="Nhập lại mật khẩu" className="input" />
              {errors.confirm && <p className="text-red-400 text-[11px] mt-1">{errors.confirm.message}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-2">
              {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký miễn phí →'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#64748b] mt-5">
            Đã có tài khoản?{' '}
            <Link href="/auth/login" className="text-acc hover:underline font-medium">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
