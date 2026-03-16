// src/app/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { CourseCard } from '@/components/course/CourseCard';
import { PaymentModal } from '@/components/course/PaymentModal';
import { useCourses } from '@/hooks/useCourses';
import { Course } from '@/types';
import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'next/navigation';

const FILTERS = ['Tất cả', 'Backend', 'Frontend', 'DevOps', 'Data / AI'];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cat, setCat] = useState('');
  const [buyTarget, setBuyTarget] = useState<Course | null>(null);

  const { data, isLoading } = useCourses({ category: cat || undefined, limit: 12 });

  const handleBuy = (course: Course) => {
    if (!user) { router.push('/auth/login'); return; }
    setBuyTarget(course);
  };

  return (
    <>
      <Navbar />
      <main>
        <section className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[rgba(0,212,255,0.07)] border border-[rgba(0,212,255,0.2)] rounded-full text-[12px] text-acc font-medium font-mono mb-5">
              <span className="w-1.5 h-1.5 bg-acc3 rounded-full animate-pulse" />
              Nền tảng học lập trình #1 VN
            </div>
            <h1 className="text-[40px] font-bold leading-[1.15] tracking-tight mb-4">
              Nâng cấp kỹ năng<br />
              <span className="bg-gradient-to-r from-acc to-acc2 bg-clip-text text-transparent">
                lập trình của bạn
              </span>
            </h1>
            <p className="text-[15px] text-[#94a3b8] leading-relaxed mb-8 max-w-md">
              Từ Python đến Cloud — học từ chuyên gia thực chiến. Bài tập thực tế, quiz kiểm tra, chứng chỉ có giá trị.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/courses" className="btn-primary px-6 py-3">Xem khóa học →</Link>
              {!user ? (
                <Link href="/auth/register" className="btn-secondary px-6 py-3">Tạo tài khoản miễn phí</Link>
              ) : (
                <Link href="/dashboard" className="btn-secondary px-6 py-3">Học của tôi →</Link>
              )}
            </div>
            <div className="flex gap-7 mt-9 pt-7 border-t border-border">
              {[['8,400+','Học viên'],['24','Khóa học'],['4.9★','Đánh giá'],['92%','Việc làm']].map(([n,l]) => (
                <div key={l}>
                  <div className="font-mono text-[22px] font-medium text-acc">{n}</div>
                  <div className="text-[11px] text-[#64748b] uppercase tracking-[0.5px] mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="bg-card border border-border2 rounded-[14px] p-6 font-mono text-[13px] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              <div className="flex gap-1.5 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              {[
                [1, <><span className="text-[#c792ea]">def</span> <span className="text-[#82aaff]">learn_to_code</span>(skill):</>],
                [2, <><span className="ml-4 text-[#4a5568]"># Your journey starts here 🚀</span></>],
                [3, <><span className="ml-4">courses = </span><span className="text-[#82aaff]">DevLearn</span>.get(skill)</>],
                [4, <><span className="ml-4 text-[#c792ea]">for</span> lesson <span className="text-[#c792ea]">in</span> courses:</>],
                [5, <><span className="ml-8">lesson.</span><span className="text-[#82aaff]">watch</span>() <span className="text-[#4a5568]"># 🎬</span></>],
                [6, <><span className="ml-8">lesson.</span><span className="text-[#82aaff]">quiz</span>() <span className="text-[#4a5568]">{'  '}# ✅</span></>],
                [7, <><span className="ml-4 text-[#c792ea]">return</span> <span className="text-acc3">"certified dev"</span> 🏆<span className="typing-cursor" /></>],
              ].map(([ln, content]) => (
                <div key={ln as number} className="flex gap-3.5 leading-[1.85]">
                  <span className="text-[#64748b] min-w-[18px] text-right text-[12px] select-none">{ln}</span>
                  <span>{content}</span>
                </div>
              ))}
            </div>
            <div className="float-anim-2 absolute -bottom-3.5 -left-5 flex items-center gap-2 bg-card border border-[rgba(6,255,165,0.3)] rounded-[9px] px-3.5 py-2.5 text-acc3 font-mono text-[11px] shadow-lg">
              ✅ Quiz passed · 95%
            </div>
            <div className="float-anim absolute -top-3.5 -right-3 flex items-center gap-2 bg-card border border-[rgba(124,58,237,0.4)] rounded-[9px] px-3.5 py-2.5 text-purple-400 font-mono text-[11px] shadow-lg">
              🏆 Certificate issued
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[22px] font-bold">
              Khóa học <span className="text-acc font-mono">[ {data?.total ?? 0} ]</span>
            </h2>
            <span className="text-[13px] text-[#94a3b8]">Cập nhật liên tục</span>
          </div>
          <div className="flex gap-2 flex-wrap mb-6">
            {FILTERS.map((f) => {
              const val = f === 'Tất cả' ? '' : f;
              return (
                <button key={f} onClick={() => setCat(val)}
                  className={`px-3.5 py-1.5 rounded-[6px] text-[12px] font-medium border transition-all ${
                    cat === val ? 'border-acc bg-[rgba(0,212,255,0.08)] text-acc' : 'border-border2 text-[#94a3b8] hover:border-acc hover:text-acc'
                  }`}>
                  {f}
                </button>
              );
            })}
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-72 animate-pulse bg-card" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.data.map((course) => <CourseCard key={course.id} course={course} onBuy={handleBuy} />)}
            </div>
          )}
        </section>
      </main>

      <PaymentModal course={buyTarget} onClose={() => setBuyTarget(null)} />

      <footer className="border-t border-border py-8 text-center text-[13px] text-[#64748b]">
        <span className="font-mono">© {new Date().getFullYear()} DevLearn</span> — Nền tảng học lập trình cộng đồng
      </footer>
    </>
  );
}