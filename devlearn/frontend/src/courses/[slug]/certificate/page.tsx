// src/app/courses/[slug]/certificate/page.tsx
'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useCourse } from '@/hooks/useCourses';
import { useCertificate } from '@/hooks/useQuiz';
import { useAuthStore } from '@/lib/store/auth.store';
import { formatDate } from '@/lib/utils';
import { Award, Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CertificatePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const { data: course } = useCourse(slug);
  const { data: cert, isLoading, error } = useCertificate(course?.id ?? '');

  if (isLoading) return <><Navbar /><div className="max-w-2xl mx-auto px-6 py-12"><div className="h-80 bg-card rounded-[14px] animate-pulse" /></div></>;

  if (error || !cert) return (
    <>
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <div className="text-[44px] mb-4">🔒</div>
        <h2 className="text-[18px] font-bold mb-2">Chưa có chứng chỉ</h2>
        <p className="text-[13px] text-[#94a3b8] mb-6">Hoàn thành quiz với điểm ≥75% để nhận chứng chỉ.</p>
        <Link href={`/courses/${slug}/quiz`} className="btn-primary">Làm quiz ngay →</Link>
      </div>
    </>
  );

  const scorePct = Math.round((cert.score / cert.total) * 100);

  return (
    <>
      <Navbar />
      <div className="max-w-[600px] mx-auto px-6 py-12">
        {/* Certificate card */}
        <div className="bg-card border border-border2 rounded-[18px] p-10 text-center relative overflow-hidden">
          {/* Top glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,212,255,0.07),transparent_60%)] pointer-events-none" />
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-acc to-transparent" />

          <p className="font-mono text-[10px] text-acc uppercase tracking-[2.5px] mb-4">Certificate of Completion · DevLearn</p>

          <div className="w-[76px] h-[76px] bg-gradient-to-br from-acc to-acc2 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(0,212,255,0.2)]">
            <Award size={34} className="text-black" />
          </div>

          <p className="text-[13px] text-[#94a3b8] mb-1">Chứng nhận rằng</p>
          <h1 className="text-[26px] font-bold mb-2">{user?.name || cert.user?.name}</h1>
          <p className="text-[13px] text-[#94a3b8] mb-1">đã hoàn thành xuất sắc khóa học</p>
          <p className="text-[18px] font-semibold text-acc mb-6">📚 {cert.course?.title}</p>

          <hr className="border-border2 mb-5" />

          <div className="text-[13px] text-[#94a3b8] leading-[2.2] space-y-0.5">
            <div>Điểm quiz: <span className="text-[#e2e8f0] font-medium">{cert.score}/{cert.total} câu · {scorePct}%</span></div>
            <div>Cấp độ: <span className="text-[#e2e8f0] font-medium">{cert.course?.level}</span></div>
            <div>Ngày hoàn thành: <span className="text-[#e2e8f0] font-medium">{formatDate(cert.issuedAt)}</span></div>
            <div>Mã chứng chỉ: <code className="font-mono text-acc text-[12px]">{cert.code}</code></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button onClick={() => toast('📥 Đang tạo PDF...')} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Download size={15} /> Tải chứng chỉ PDF
          </button>
          <button onClick={() => { navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/certificate/${cert.code}`); toast.success('Đã sao chép link!'); }}
                  className="btn-secondary flex items-center gap-2 px-4">
            <Share2 size={15} /> Chia sẻ
          </button>
        </div>

        <div className="text-center mt-5">
          <Link href="/dashboard" className="text-[13px] text-acc hover:underline">← Về Dashboard</Link>
        </div>
      </div>
    </>
  );
}
