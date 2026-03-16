// src/app/courses/[slug]/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { PaymentModal } from '@/components/course/PaymentModal';
import { useCourse } from '@/hooks/useCourses';
import { useMarkLessonComplete } from '@/hooks/useCourses';
import { useAuthStore } from '@/lib/store/auth.store';
import { Lesson } from '@/types';
import { formatPrice, LEVEL_MAP, cn } from '@/lib/utils';
import { CheckCircle2, Circle, PlayCircle, Lock, ChevronDown, ChevronRight, FileQuestion, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: course, isLoading } = useCourse(slug);
  const { mutate: markComplete } = useMarkLessonComplete();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [buyTarget, setBuyTarget] = useState<any>(null);

  if (isLoading) return <><Navbar /><div className="max-w-5xl mx-auto px-6 py-12"><div className="h-96 bg-card rounded-[14px] animate-pulse" /></div></>;
  if (!course) return <><Navbar /><div className="p-10 text-center text-[#64748b]">Không tìm thấy khóa học.</div></>;

  const level = LEVEL_MAP[course.level];
  const toggleSection = (id: string) => {
    setOpenSections((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!course.isOwned && !lesson.isFree) {
      if (!user) { router.push('/auth/login'); return; }
      setBuyTarget(course);
      return;
    }
    setActiveLesson(lesson);
  };

  const handleMarkDone = () => {
    if (!activeLesson) return;
    markComplete(activeLesson.id, {
      onSuccess: () => toast.success('✅ Đã đánh dấu hoàn thành!'),
    });
  };

  return (
    <>
      <Navbar />

      {/* Top bar */}
      <div className="border-b border-border bg-surface px-6 py-3 flex items-center gap-3">
        <Link href="/courses" className="text-[13px] text-[#64748b] hover:text-[#e2e8f0]">Khóa học</Link>
        <ChevronRight size={13} className="text-[#64748b]" />
        <span className="text-[13px] font-medium truncate">{course.title}</span>
        <div className="ml-auto flex gap-2">
          {course.isOwned && (
            <>
              <Link href={`/courses/${slug}/quiz`} className="btn-primary text-[12px] py-1.5 px-3 flex items-center gap-1.5">
                <FileQuestion size={13} /> Làm Quiz
              </Link>
              <Link href={`/courses/${slug}/certificate`} className="btn-ghost text-[12px] py-1.5 px-3 flex items-center gap-1.5">
                <Award size={13} /> Chứng chỉ
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-0 grid grid-cols-1 lg:grid-cols-[1fr_300px] min-h-[calc(100vh-112px)]">
        {/* Video pane */}
        <div className="p-6 border-r border-border">
          {/* Player */}
          <div className="bg-card border border-border2 rounded-[12px] aspect-video flex items-center justify-center relative overflow-hidden group cursor-pointer mb-5"
               onClick={() => activeLesson && toast('▶ Đang phát: ' + activeLesson.title)}>
            <div className="absolute inset-0 bg-radial-gradient opacity-20" />
            <div className="text-[60px] absolute opacity-10 select-none">
              {course.isOwned ? '🎬' : '🔒'}
            </div>
            <div className="w-14 h-14 bg-acc rounded-full flex items-center justify-center text-black text-[22px] relative z-10 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(0,212,255,0.3)]">▶</div>
          </div>

          {activeLesson ? (
            <>
              <h2 className="text-[17px] font-semibold mb-2">{activeLesson.title}</h2>
              <p className="text-[13px] text-[#94a3b8] mb-4 leading-relaxed">
                Nội dung bài học về "{activeLesson.title}". Video trình bày lý thuyết kết hợp demo code thực tế.
              </p>
              {course.isOwned && (
                <button onClick={handleMarkDone} className="btn-secondary text-[12px] flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-acc3" /> Đánh dấu hoàn thành
                </button>
              )}
            </>
          ) : (
            <div>
              <h1 className="text-[20px] font-bold mb-2">{course.title}</h1>
              <p className="text-[13px] text-[#94a3b8] leading-relaxed mb-4">{course.shortDesc}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={cn('badge', level.class)}>{level.label}</span>
                <span className="badge badge-blue">{course.category?.name}</span>
                {course.tags.map((t) => <span key={t} className="px-2 py-0.5 bg-[#1e1e2e] border border-border2 rounded font-mono text-[10px] text-[#94a3b8]">{t}</span>)}
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-mono text-[22px] font-medium">{formatPrice(course.price)}</span>
                  {course.oldPrice && <span className="text-[12px] text-[#64748b] line-through ml-2">{formatPrice(course.oldPrice)}</span>}
                </div>
                {!course.isOwned && (
                  <button onClick={() => { if (!user) router.push('/auth/login'); else setBuyTarget(course); }}
                          className="btn-primary px-6 py-2.5">
                    Mua khóa học
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lessons sidebar */}
        <div className="overflow-y-auto max-h-[calc(100vh-112px)]">
          <div className="sticky top-0 px-4 py-3 bg-surface border-b border-border font-mono text-[11px] text-[#64748b] uppercase tracking-[0.5px]">
            Nội dung khóa học · {course.totalLessons} bài
          </div>
          {course.sections?.map((sec) => {
            const isOpen = openSections.has(sec.id);
            return (
              <div key={sec.id} className="border-b border-border">
                <button onClick={() => toggleSection(sec.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-semibold hover:bg-[#1e1e2e] transition-colors text-left">
                  <span>{sec.title}</span>
                  {isOpen ? <ChevronDown size={14} className="text-[#64748b]" /> : <ChevronRight size={14} className="text-[#64748b]" />}
                </button>
                {isOpen && sec.lessons.map((lesson) => {
                  const done = course.userProgress?.[lesson.id];
                  const isActive = activeLesson?.id === lesson.id;
                  const canAccess = course.isOwned || lesson.isFree;
                  return (
                    <div key={lesson.id}
                         onClick={() => handleLessonClick(lesson)}
                         className={cn(
                           'flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-t border-border text-[13px]',
                           isActive ? 'bg-[rgba(0,212,255,0.06)] border-l-2 border-l-acc' : 'hover:bg-[#1e1e2e]'
                         )}>
                      <span className="shrink-0 w-[18px] text-center">
                        {done ? <CheckCircle2 size={14} className="text-acc3" />
                               : canAccess ? <PlayCircle size={14} className={isActive ? 'text-acc' : 'text-[#64748b]'} />
                               : <Lock size={13} className="text-[#64748b]" />}
                      </span>
                      <span className={cn('flex-1 leading-snug', isActive && 'text-acc')}>{lesson.title}</span>
                      <span className="font-mono text-[10px] text-[#64748b] shrink-0">{lesson.duration}m</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <PaymentModal course={buyTarget} onClose={() => setBuyTarget(null)} />
    </>
  );
}
