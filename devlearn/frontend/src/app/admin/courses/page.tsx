// src/app/admin/courses/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useCourses } from '@/hooks/useCourses';
import { useAuthStore } from '@/lib/store/auth.store';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, FileQuestion, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminCoursesPage() {
  const { user } = useAuthStore();
  const { data, isLoading, refetch } = useCourses({ limit: 50 });
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const togglePublish = async (courseId: string, current: boolean) => {
    try {
      await api.patch(`/admin/courses/${courseId}/toggle`);
      toast.success(current ? 'Đã ẩn khóa học' : 'Đã publish khóa học');
      refetch();
      qc.invalidateQueries({ queryKey: ['courses'] });
    } catch {
      toast.error('Lỗi cập nhật');
    }
  };

  const deleteCourse = async (courseId: string, title: string) => {
    if (!confirm(`Xóa khóa học "${title}"? Hành động này không thể hoàn tác!`)) return;
    setDeletingId(courseId);
    try {
      await api.delete(`/admin/courses/${courseId}`);
      toast.success('Đã xóa khóa học');
      refetch();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi xóa');
    } finally {
      setDeletingId(null);
    }
  };

  const LEVEL_LABEL: Record<string, string> = {
    BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced',
  };
  const LEVEL_CLASS: Record<string, string> = {
    BEGINNER: 'badge-green', INTERMEDIATE: 'badge-yellow', ADVANCED: 'badge-purple',
  };

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold">Quản lý khóa học</h1>
            <p className="text-[12px] text-[#64748b] font-mono mt-1">// {data?.total ?? 0} khóa học</p>
          </div>
          <Link href="/admin/courses/new" className="btn-primary flex items-center gap-2 px-5 py-2.5">
            <Plus size={15} /> Thêm khóa học mới
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-card rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-[14px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  {['Khóa học', 'Danh mục', 'Level', 'Giá', 'Học viên', 'Bài học', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-[0.5px] font-mono bg-[rgba(0,0,0,0.2)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data.map((c: any) => (
                  <tr key={c.id} className="border-b border-border hover:bg-[rgba(255,255,255,0.015)]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[14px] max-w-[200px] truncate">{c.title}</div>
                      <div className="text-[11px] text-[#64748b] font-mono">{c.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-blue">{c.category?.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${LEVEL_CLASS[c.level]}`}>{LEVEL_LABEL[c.level]}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">{formatPrice(c.price)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-[#94a3b8]">
                        <Users size={12} />{c.enrollmentCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-[#94a3b8]">
                        <BookOpen size={12} />{c.totalLessons}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${c.isPublished ? 'badge-green' : 'badge-red'}`}>
                        {c.isPublished ? '● Published' : '● Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/admin/courses/${c.id}/edit`}
                              className="p-1.5 rounded-[6px] bg-[rgba(0,212,255,0.08)] text-acc hover:bg-[rgba(0,212,255,0.18)] transition-colors"
                              title="Sửa thông tin">
                          <Pencil size={13} />
                        </Link>
                        <Link href={`/admin/courses/${c.id}/lessons`}
                              className="p-1.5 rounded-[6px] bg-[rgba(124,58,237,0.1)] text-purple-400 hover:bg-[rgba(124,58,237,0.2)] transition-colors"
                              title="Quản lý bài học">
                          <BookOpen size={13} />
                        </Link>
                        <Link href={`/admin/courses/${c.id}/quiz`}
                              className="p-1.5 rounded-[6px] bg-[rgba(245,158,11,0.1)] text-yellow-400 hover:bg-[rgba(245,158,11,0.2)] transition-colors"
                              title="Quản lý quiz">
                          <FileQuestion size={13} />
                        </Link>
                        <button onClick={() => togglePublish(c.id, c.isPublished)}
                                className="p-1.5 rounded-[6px] bg-[rgba(6,255,165,0.08)] text-acc3 hover:bg-[rgba(6,255,165,0.18)] transition-colors"
                                title={c.isPublished ? 'Ẩn khóa học' : 'Publish'}>
                          {c.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button onClick={() => deleteCourse(c.id, c.title)}
                                disabled={deletingId === c.id}
                                className="p-1.5 rounded-[6px] bg-[rgba(239,68,68,0.08)] text-red-400 hover:bg-[rgba(239,68,68,0.18)] transition-colors"
                                title="Xóa khóa học">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
