// src/app/auth/login/page.tsx
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
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      await login(data.email, data.password);
      toast.success('Đăng nhập thành công!');
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-acc to-acc2 flex items-center justify-center">
            <Code2 size={17} className="text-black" />
          </div>
          <span className="font-mono text-[17px] font-medium">Dev<span className="text-acc">Learn</span></span>
        </Link>

        <div className="bg-surface border border-border2 rounded-[18px] p-8">
          <h1 className="text-[20px] font-bold mb-1.5">Đăng nhập</h1>
          <p className="text-[13px] text-[#94a3b8] mb-6">Chào mừng trở lại! Tiếp tục hành trình code.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input" />
              {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <input {...register('password')} type="password" placeholder="••••••••" className="input" />
              {errors.password && <p className="text-red-400 text-[11px] mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-2">
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập →'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#64748b] mt-5">
            Chưa có tài khoản?{' '}
            <Link href="/auth/register" className="text-acc hover:underline font-medium">Đăng ký miễn phí</Link>
          </p>

          {/* Demo hint */}
          <div className="mt-5 p-3 bg-bg border border-border rounded-[8px] font-mono text-[11px] text-[#64748b] leading-relaxed">
            // Demo:<br />
            <span className="text-acc3">admin@devlearn.vn</span> → Admin panel<br />
            <span className="text-acc3">demo@devlearn.vn</span> → Demo / <span className="text-[#94a3b8]">Demo@123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
