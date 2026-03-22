// src/app/courses/[slug]/quiz/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useCourse } from '@/hooks/useCourses';
import { useQuiz, useSubmitQuiz } from '@/hooks/useQuiz';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: course } = useCourse(slug);
  const { data: quizData, isLoading } = useQuiz(course?.id ?? '');
  const { mutate: submit, isPending } = useSubmitQuiz();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<any>(null);

  if (isLoading || !quizData) return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="h-64 bg-card rounded-[14px] animate-pulse" />
      </div>
    </>
  );

  const questions = quizData.questions ?? [];
  const total = questions.length;

  const initAnswers = () => {
    setAnswers(new Array(total).fill(null));
    setCurrent(0);
    setResult(null);
  };

  if (answers.length === 0 && total > 0) {
    setAnswers(new Array(total).fill(null));
  }

  const pick = (optIdx: number) => {
    const next = [...answers];
    next[current] = optIdx;
    setAnswers(next);
  };

  const handleSubmit = () => {
    if (answers.some((a) => a === null)) { toast.error('Trả lời tất cả câu hỏi!'); return; }
    submit(
     { courseId: course!.id, answers: answers as number[] },
      {
        onSuccess: (data) => setResult(data),
        onError: (e: any) => toast.error(e.response?.data?.message || 'Lỗi nộp bài'),
      }
    );
  };

  const pct = total ? Math.round((current / total) * 100) : 0;
  const q = questions[current];

  if (result) {
    const score = result?.score ?? result?.attempt?.score ?? 0;
    const total = result?.total ?? result?.attempt?.total ?? 0;
    const passed = result?.passed ?? result?.attempt?.passed ?? false;
    const scorePct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <>
        <Navbar />
        <div className="max-w-[640px] mx-auto px-6 py-12 text-center">
          <div className="text-[52px] mb-4">{result.passed ? '🏆' : '📚'}</div>
          <div className="font-mono text-[56px] font-medium text-acc leading-none">{result.score}/{result.total}</div>
          <div className={`text-[28px] font-bold mt-2 ${result.passed ? 'text-acc3' : 'text-yellow-400'}`}>{scorePct}%</div>
          <p className="text-[14px] text-[#94a3b8] mt-3 mb-4">
            {result.passed ? 'Xuất sắc! Bạn đã nắm vững kiến thức.' : 'Cần ôn tập thêm. Xem lại bài học rồi thử lại!'}
          </p>
          <span className={cn('inline-block px-5 py-1.5 rounded-full text-[13px] font-semibold font-mono mb-8',
            result.passed ? 'bg-[rgba(6,255,165,0.1)] text-acc3 border border-[rgba(6,255,165,0.2)]'
                          : 'bg-[rgba(245,158,11,0.1)] text-yellow-400 border border-[rgba(245,158,11,0.2)]'
          )}>
            {result.passed ? '// PASSED ≥75%' : '// FAILED <75%'}
          </span>
          <div className="flex gap-3 justify-center flex-wrap">
            {result.passed && (
              <Link href={`/courses/${slug}/certificate`} className="btn-primary">🏆 Nhận chứng chỉ</Link>
            )}
            <button onClick={initAnswers} className="btn-secondary">↺ Làm lại</button>
            <Link href={`/courses/${slug}`} className="btn-secondary">← Bài học</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="border-b border-border bg-surface px-6 py-3 flex items-center gap-2 text-[13px]">
        <Link href={`/courses/${slug}`} className="text-[#64748b] hover:text-[#e2e8f0]">{course?.title}</Link>
        <ChevronRight size={13} className="text-[#64748b]" />
        <span className="font-medium">Quiz</span>
      </div>

      <div className="max-w-[660px] mx-auto px-6 py-10">
        <div className="mb-2 font-mono text-[10px] text-[#64748b] uppercase tracking-[0.5px]">{course?.title}</div>
        <h1 className="text-[22px] font-bold mb-6">Kiểm tra kiến thức</h1>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-7">
          <span className="font-mono text-[12px] text-[#64748b] whitespace-nowrap">Q{current + 1}/{total}</span>
          <div className="flex-1 h-1.5 bg-border2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-acc to-acc2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono text-[12px] text-[#64748b]">{pct}%</span>
        </div>

        {/* Question */}
        <p className="text-[17px] font-semibold leading-[1.55] mb-5">{q.question}</p>

        {q.codeSnippet && (
          <pre className="bg-card border border-border2 rounded-[9px] px-4 py-3.5 font-mono text-[12px] text-acc3 mb-5 overflow-x-auto whitespace-pre leading-relaxed">
            {q.codeSnippet}
          </pre>
        )}

        {/* Options */}
        <div className="flex flex-col gap-2.5 mb-7">
          {q.options.map((opt: string, idx: number) => (
            <button
              key={idx}
              onClick={() => pick(idx)}
              className={cn(
                'flex items-center gap-3 p-3.5 border rounded-[10px] text-[14px] text-left transition-all bg-card',
                answers[current] === idx
                  ? 'border-acc bg-[rgba(0,212,255,0.08)] text-acc'
                  : 'border-border2 hover:border-acc hover:bg-[rgba(0,212,255,0.04)]'
              )}
            >
              <span className={cn('w-7 h-7 rounded-[6px] border flex items-center justify-center font-mono text-[11px] font-semibold shrink-0',
                answers[current] === idx ? 'border-acc text-acc' : 'border-[#64748b] text-[#64748b]'
              )}>{'ABCD'[idx]}</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {current > 0 && (
            <button onClick={() => setCurrent(current - 1)} className="btn-secondary">← Trước</button>
          )}
          {current < total - 1 ? (
            <button onClick={() => { if (answers[current] === null) { toast.error('Chọn đáp án trước!'); return; } setCurrent(current + 1); }}
                    className="btn-primary">Câu tiếp →</button>
          ) : (
            <button onClick={handleSubmit} disabled={isPending} className="btn-primary">
              {isPending ? 'Đang nộp...' : '✓ Nộp bài'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
