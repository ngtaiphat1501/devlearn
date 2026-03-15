// src/components/course/CourseCard.tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Course } from '@/types';
import { formatPrice, LEVEL_MAP, cn } from '@/lib/utils';
import { BookOpen, FileQuestion, Users } from 'lucide-react';

const EMOJI_MAP: Record<string, string> = {
  'python-fundamentals': '🐍', 'react-typescript': '⚛️',
  'docker-kubernetes': '🐳', 'machine-learning-python': '🤖',
  'nodejs-rest-api': '🟢', 'aws-cloud-essentials': '☁️',
};
const GRAD_MAP: Record<string, string> = {
  Backend: 'from-[#0d2818] to-[#0a1f0a]',
  Frontend: 'from-[#0a1929] to-[#041429]',
  DevOps: 'from-[#041429] to-[#1a0f00]',
  'Data / AI': 'from-[#1a0533] to-[#0d0020]',
};

interface Props {
  course: Course;
  onBuy?: (course: Course) => void;
}

export function CourseCard({ course, onBuy }: Props) {
  const level = LEVEL_MAP[course.level];
  const grad = GRAD_MAP[course.category?.name] ?? 'from-[#0d2818] to-[#0a1f0a]';
  const emoji = EMOJI_MAP[course.slug] ?? '📚';

  return (
    <div className="card group hover:-translate-y-1 hover:border-border2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-200">
      {/* Thumbnail */}
      <div className={cn('h-32 bg-gradient-to-br flex items-center justify-center relative overflow-hidden', grad)}>
        {course.thumbnail ? (
          <Image src={course.thumbnail} alt={course.title} fill className="object-cover opacity-60" />
        ) : (
          <span className="text-5xl relative z-10">{emoji}</span>
        )}
        <span className="absolute top-2.5 left-2.5 bg-black/60 border border-white/10 text-[#94a3b8] font-mono text-[10px] px-2 py-0.5 rounded">
          {course.category?.name}
        </span>
        <span className={cn('absolute top-2.5 right-2.5 badge', level.class)}>
          {level.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="font-mono text-[10px] text-acc uppercase tracking-[0.5px] mb-1.5">{course.category?.name}</p>
        <h3 className="font-semibold text-[14px] leading-snug mb-2 line-clamp-2">{course.title}</h3>

        <div className="flex gap-3 text-[11px] text-[#64748b] mb-3">
          <span className="flex items-center gap-1"><BookOpen size={11} />{course.totalLessons} bài</span>
          <span className="flex items-center gap-1"><FileQuestion size={11} />Quiz</span>
          {course.enrollmentCount !== undefined && (
            <span className="flex items-center gap-1"><Users size={11} />{course.enrollmentCount}</span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {course.tags.slice(0, 3).map((t) => (
            <span key={t} className="px-2 py-0.5 bg-[#1e1e2e] border border-border2 rounded font-mono text-[10px] text-[#94a3b8]">{t}</span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="font-mono text-[16px] font-medium">{formatPrice(course.price)}</span>
            {course.oldPrice && (
              <span className="text-[11px] text-[#64748b] line-through ml-1.5">{formatPrice(course.oldPrice)}</span>
            )}
          </div>
          {course.isOwned ? (
            <Link href={`/courses/${course.slug}`} className="buy-btn-owned px-3 py-1.5 bg-[rgba(6,255,165,0.1)] text-acc3 border border-[rgba(6,255,165,0.25)] rounded-[7px] text-[12px] font-bold hover:bg-[rgba(6,255,165,0.2)] transition-colors">
              ▶ Học tiếp
            </Link>
          ) : (
            <button
              onClick={() => onBuy?.(course)}
              className="px-3 py-1.5 bg-acc text-black rounded-[7px] text-[12px] font-bold hover:bg-[#00bde0] transition-colors"
            >
              Mua ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
