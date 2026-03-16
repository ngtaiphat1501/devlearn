// src/app/courses/[slug]/learn/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Circle,
  BookOpen, FileQuestion, Award, Play, Lock, ChevronDown, ChevronUp
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isCloudinary(url: string): boolean {
  return url?.includes('cloudinary.com') || url?.includes('res.cloudinary');
}

function VideoPlayer({ url, title }: { url?: string | null; title: string }) {
  if (!url) {
    return (
      <div className="w-full aspect-video bg-[#0d1117] rounded-[14px] flex flex-col items-center justify-center border border-border2 gap-3">
        <div className="w-14 h-14 rounded-full bg-[rgba(0,212,255,0.08)] flex items-center justify-center">
          <Play size={22} className="text-acc ml-1" />
        </div>
        <p className="text-[13px] text-[#64748b]">Chưa có video cho bài học này</p>
      </div>
    );
  }

  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <div className="w-full aspect-video rounded-[14px] overflow-hidden border border-border2">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  if (isCloudinary(url) || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov')) {
    return (
      <div className="w-full aspect-video rounded-[14px] overflow-hidden border border-border2 bg-black">
        <video
          src={url}
          controls
          className="w-full h-full"
          controlsList="nodownload"
        >
          Trình duyệt của bạn không hỗ trợ video.
        </video>
      </div>
    );
  }

  // Generic iframe fallback
  return (
    <div className="w-full aspect-video rounded-[14px] overflow-hidden border border-border2">
      <iframe src={url} title={title} allowFullScreen className="w-full h-full" />
    </div>
  );
}

// ── types ─────────────────────────────────────────────────────────────
interface Lesson {
  id: string;
  title: string;
  duration: number;
  isFree: boolean;
  videoUrl?: string | null;
  description?: string | null;
  isCompleted?: boolean;
}
interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}
interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  sections: Section[];
  hasQuiz?: boolean;
}

// ── main component ────────────────────────────────────────────────────
export default function LearnPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // flatten all lessons for prev/next
  const allLessons = course?.sections.flatMap((s) => s.lessons) ?? [];
  const currentIdx = allLessons.findIndex((l) => l.id === currentLesson?.id);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    fetchCourse();
  }, [slug, user]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${slug}/learn`);
      const data = res.data;
      setCourse(data);
      // open all sections by default
      const ids = new Set<string>(data.sections?.map((s: Section) => s.id) ?? []);
      setOpenSections(ids);
      // set progress
      const done = new Set<string>(
        data.sections?.flatMap((s: Section) =>
          s.lessons.filter((l: Lesson) => l.isCompleted).map((l: Lesson) => l.id)
        ) ?? []
      );
      setCompletedIds(done);
      // pick first lesson
      const first = data.sections?.[0]?.lessons?.[0];
      if (first) setCurrentLesson(first);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error('Bạn chưa có quyền truy cập khóa học này');
        router.push(`/courses/${slug}`);
      } else {
        toast.error('Không thể tải khóa học');
      }
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (lessonId: string) => {
    try {
      await api.post(`/lessons/${lessonId}/complete`);
      setCompletedIds((prev) => { const s = new Set(Array.from(prev)); s.add(lessonId); return s; });
      toast.success('Đã đánh dấu hoàn thành!');
    } catch {
      // optimistic update anyway
      setCompletedIds((prev) => { const s = new Set(Array.from(prev)); s.add(lessonId); return s; });
    }
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const s = new Set(Array.from(prev));
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l) => completedIds.has(l.id)).length;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-acc border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!course) return null;

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside className="w-[300px] min-w-[300px] border-r border-border2 bg-[#0d1117] flex flex-col overflow-hidden">
          {/* header */}
          <div className="px-4 py-4 border-b border-border2">
            <Link href={`/courses/${slug}`}
                  className="flex items-center gap-1.5 text-[12px] text-[#64748b] hover:text-acc transition-colors mb-3">
              <ChevronLeft size={14} /> Khóa học
            </Link>
            <p className="text-[13px] font-semibold text-white leading-tight line-clamp-2">{course.title}</p>
            {/* progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-[#64748b] mb-1">
                <span>Tiến độ</span>
                <span className="text-acc font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                <div className="h-full bg-acc rounded-full transition-all duration-500"
                     style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">{completedCount}/{totalLessons} bài hoàn thành</p>
            </div>
          </div>

          {/* lesson list */}
          <div className="flex-1 overflow-y-auto">
            <p className="px-4 py-2 text-[11px] text-[#475569] font-semibold uppercase tracking-widest">
              Nội dung khóa học · {totalLessons} bài
            </p>
            {course.sections.map((sec, si) => (
              <div key={sec.id}>
                <button
                  onClick={() => toggleSection(sec.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[rgba(255,255,255,0.03)] transition-colors text-left"
                >
                  <span className="text-[12px] font-semibold text-white">{sec.title}</span>
                  {openSections.has(sec.id)
                    ? <ChevronUp size={13} className="text-[#475569]" />
                    : <ChevronDown size={13} className="text-[#475569]" />}
                </button>
                {openSections.has(sec.id) && (
                  <div>
                    {sec.lessons.map((lesson) => {
                      const done = completedIds.has(lesson.id);
                      const active = currentLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setCurrentLesson(lesson)}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-all ${
                            active
                              ? 'bg-[rgba(0,212,255,0.08)] border-l-2 border-acc'
                              : 'hover:bg-[rgba(255,255,255,0.03)] border-l-2 border-transparent'
                          }`}
                        >
                          {done
                            ? <CheckCircle2 size={14} className="text-acc shrink-0" />
                            : <Circle size={14} className="text-[#475569] shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className={`text-[12px] leading-tight truncate ${active ? 'text-acc font-medium' : 'text-[#94a3b8]'}`}>
                              {lesson.title}
                            </p>
                            <p className="text-[10px] text-[#475569] mt-0.5">{lesson.duration}p</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* bottom actions */}
          <div className="px-4 py-3 border-t border-border2 flex gap-2">
            {course.hasQuiz && (
              <Link href={`/courses/${slug}/quiz`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[8px] bg-[rgba(0,212,255,0.08)] border border-acc text-acc text-[12px] font-medium hover:bg-[rgba(0,212,255,0.14)] transition-colors">
                <FileQuestion size={13} /> Làm Quiz
              </Link>
            )}
            {progress === 100 && (
              <Link href={`/courses/${slug}/certificate`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[8px] bg-[rgba(250,204,21,0.08)] border border-yellow-400 text-yellow-400 text-[12px] font-medium hover:bg-[rgba(250,204,21,0.14)] transition-colors">
                <Award size={13} /> Chứng chỉ
              </Link>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto bg-[#080c10]">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto px-6 py-6">
              {/* VIDEO */}
              <VideoPlayer url={currentLesson.videoUrl} title={currentLesson.title} />

              {/* lesson info */}
              <div className="mt-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-[20px] font-bold text-white leading-tight">{currentLesson.title}</h1>
                  {currentLesson.description && (
                    <p className="mt-2 text-[13px] text-[#94a3b8] leading-relaxed">{currentLesson.description}</p>
                  )}
                </div>
                <button
                  onClick={() => markComplete(currentLesson.id)}
                  disabled={completedIds.has(currentLesson.id)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-medium border transition-all ${
                    completedIds.has(currentLesson.id)
                      ? 'border-acc bg-[rgba(0,212,255,0.08)] text-acc cursor-default'
                      : 'border-border2 text-[#94a3b8] hover:border-acc hover:text-acc'
                  }`}
                >
                  <CheckCircle2 size={15} />
                  {completedIds.has(currentLesson.id) ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                </button>
              </div>

              {/* prev / next */}
              <div className="flex justify-between mt-6 pt-5 border-t border-border2">
                <button
                  onClick={() => currentIdx > 0 && setCurrentLesson(allLessons[currentIdx - 1])}
                  disabled={currentIdx <= 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-border2 text-[13px] text-[#94a3b8] hover:border-acc hover:text-acc transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} /> Bài trước
                </button>
                <span className="text-[12px] text-[#475569] self-center font-mono">
                  {currentIdx + 1} / {totalLessons}
                </span>
                <button
                  onClick={() => currentIdx < allLessons.length - 1 && setCurrentLesson(allLessons[currentIdx + 1])}
                  disabled={currentIdx >= allLessons.length - 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-border2 text-[13px] text-[#94a3b8] hover:border-acc hover:text-acc transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Bài tiếp <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#475569]">
              <div className="text-center">
                <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
                <p>Chọn một bài học để bắt đầu</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}