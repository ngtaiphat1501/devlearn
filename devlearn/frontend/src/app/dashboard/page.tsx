// src/app/dashboard/page.tsx
'use client';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/lib/store/auth.store';
import { BookOpen, Award, Zap, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useDashboard();

  if (isLoading) return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-card rounded-[12px] animate-pulse" />
        ))}
      </div>
    </>
  );

  const enrollments = (data?.enrollments ?? []).filter((en: any) => en?.course);
  const totalCerts  = data?.totalCerts ?? 0;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s: number, e: any) => s + (e.progressPct ?? 0), 0) / enrollments.length)
    : 0;

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="bg-card border border-border rounded-[14px] p-6 flex items-center gap-5 mb-7">
          <div className="w-14 h-14 rounded-[12px] bg-gradient-to-br from-acc2 to-acc flex items-center justify-center text-[22px] font-bold text-white shrink-0">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-[20px] font-bold">Xin chào, {user?.name?.split(' ').at(-1)}! 👋</h1>
            <p className="text-[12px] text-[#64748b] font-mono mt-1">// {user?.email}</p>
          </div>
          <Link href="/courses" className="btn-ghost text-[13px] hidden sm:flex items-center gap-1.5">
            Khám phá thêm <ArrowRight size={13} />
          </Link>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Khóa học đã mua', value: enrollments.length, icon: <BookOpen size={16} />, color: 'text-acc' },
            { label: 'Tiến độ trung bình', value: `${avgProgress}%`, icon: <Zap size={16} />, color: 'text-acc3' },
            { label: 'Chứng chỉ', value: totalCerts, icon: <Award size={16} />, color: 'text-purple-400' },
          ].map((k) => (
            <div key={k.label} className="bg-card border border-border rounded-[12px] p-4">
              <div className="font-mono text-[26px] font-medium mt-0.5" style={{ color: k.color as any }}>
                {k.value}
              </div>
              <div className="text-[12px] text-[#64748b] mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        {/* My courses */}
        <h2 className="font-mono text-[11px] text-[#64748b] uppercase tracking-[0.5px] mb-4">
          Khóa học của tôi
        </h2>

        {enrollments.length === 0 ? (
          <div className="bg-card border border-border rounded-[12px] py-14 text-center">
            <div className="text-[44px] mb-3">📂</div>
            <p className="text-[14px] text-[#64748b] mb-4">Bạn chưa có khóa học nào.</p>
            <Link href="/courses" className="btn-primary">Khám phá khóa học →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((en: any) => {
              const c = en?.course;
              if (!c) return null;
              const pct = en.progressPct ?? 0;
              const passed = en.lastQuizAttempt?.passed;
              return (
                <div key={c.id} className="bg-card border border-border rounded-[12px] p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-[9px] bg-gradient-to-br from-acc2/30 to-acc/30 flex items-center justify-center text-[20px] shrink-0">
                      📚
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] leading-snug truncate">{c?.title ?? 'Khóa học'}</p>
                      <p className="font-mono text-[10px] text-acc mt-0.5">{c?.category?.name ?? ''}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-1 flex justify-between text-[11px] text-[#64748b]">
                    <span>Tiến độ bài học</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="progress-bar mb-4">
                    <div className="progress-bar-fill bg-acc" style={{ width: `${pct}%` }} />
                  </div>

                  {en.lastQuizAttempt && (
                    <div className="mb-4 flex justify-between text-[11px] text-[#64748b]">
                      <span>Quiz: {en.lastQuizAttempt.score}/{en.lastQuizAttempt.total} đúng</span>
                      <span className={passed ? 'text-acc3' : 'text-yellow-400'}>
                        {passed ? '✓ Đạt' : '✗ Chưa đạt'}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/courses/${c?.slug ?? ''}`}
                      className="btn-primary flex-1 text-center text-[12px] py-2"
                    >
                      ▶ Học tiếp
                    </Link>
                    <Link
                      href={`/courses/${c?.slug ?? ''}/quiz`}
                      className="btn-secondary text-[12px] py-2 px-3"
                    >
                      📝 Quiz
                    </Link>
                    {en.certificate && (
                      <Link
                        href={`/certificate/${en.certificate.code}`}
                        className="btn-secondary text-[12px] py-2 px-3"
                      >
                        🏆
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}