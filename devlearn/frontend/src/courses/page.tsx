// src/app/courses/page.tsx
'use client';
import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CourseCard } from '@/components/course/CourseCard';
import { PaymentModal } from '@/components/course/PaymentModal';
import { useCourses } from '@/hooks/useCourses';
import { Course } from '@/types';
import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const CATS   = ['Tất cả', 'Backend', 'Frontend', 'DevOps', 'Data / AI'];
const LEVELS = ['Tất cả', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const LEVEL_LABELS: Record<string, string> = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [cat,    setCat]    = useState('');
  const [level,  setLevel]  = useState('');
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(1);
  const [buyTarget, setBuyTarget] = useState<Course | null>(null);

  const { data, isLoading } = useCourses({ category: cat || undefined, level: level || undefined, search: search || undefined, page, limit: 9 });

  const handleBuy = (course: Course) => {
    if (!user) { router.push('/auth/login'); return; }
    setBuyTarget(course);
  };

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-[28px] font-bold mb-1">
          Khóa học <span className="text-acc font-mono">[ {data?.total ?? 0} ]</span>
        </h1>
        <p className="text-[14px] text-[#94a3b8] mb-7">Học từ chuyên gia thực chiến — cập nhật liên tục.</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-7 items-center">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm khóa học..."
              className="input pl-9 w-52 text-[13px]"
            />
          </div>

          {/* Category */}
          <div className="flex gap-1.5 flex-wrap">
            {CATS.map((c) => {
              const val = c === 'Tất cả' ? '' : c;
              return (
                <button key={c} onClick={() => { setCat(val); setPage(1); }}
                        className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium border transition-all ${
                          cat === val ? 'border-acc bg-[rgba(0,212,255,0.08)] text-acc' : 'border-border2 text-[#94a3b8] hover:border-acc hover:text-acc'
                        }`}>
                  {c}
                </button>
              );
            })}
          </div>

          {/* Level */}
          <select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                  className="input w-auto text-[12px] py-1.5">
            {LEVELS.map((l) => (
              <option key={l} value={l === 'Tất cả' ? '' : l}>
                {l === 'Tất cả' ? 'Tất cả cấp độ' : LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-72 animate-pulse" />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-16 text-[#64748b]">
            <div className="text-[44px] mb-3">🔍</div>
            <p>Không tìm thấy khóa học phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data.map((course) => (
              <CourseCard key={course.id} course={course} onBuy={handleBuy} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-ghost px-4 disabled:opacity-40">← Trước</button>
            {Array.from({ length: data.totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                      className={`px-3.5 py-1.5 rounded-[7px] text-[13px] border transition-all ${
                        page === i + 1 ? 'border-acc bg-[rgba(0,212,255,0.08)] text-acc' : 'border-border2 text-[#94a3b8] hover:border-acc'
                      }`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
                    className="btn-ghost px-4 disabled:opacity-40">Tiếp →</button>
          </div>
        )}
      </main>

      <PaymentModal course={buyTarget} onClose={() => setBuyTarget(null)} />

      <footer className="border-t border-border py-8 text-center text-[13px] text-[#64748b]">
        <span className="font-mono">© {new Date().getFullYear()} DevLearn</span> — Nền tảng học lập trình cộng đồng
      </footer>
    </>
  );
}
