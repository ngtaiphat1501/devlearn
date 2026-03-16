// src/app/admin/courses/[id]/lessons/page.tsx
'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, PlayCircle, Youtube } from 'lucide-react';

export default function ManageLessonsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingLesson, setAddingLesson] = useState<string | null>(null); // sectionId
  const [newLesson, setNewLesson] = useState({ title: '', videoUrl: '', duration: 10, isFree: false });

  const { data: course, isLoading } = useQuery({
    queryKey: ['admin-course', id],
    queryFn: async () => { const { data } = await api.get(`/admin/courses/${id}`); return data; },
  });

  const addSection = useMutation({
    mutationFn: (title: string) => api.post(`/admin/courses/${id}/sections`, { title }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-course', id] }); setAddingSection(false); setNewSectionTitle(''); toast.success('✓ Thêm chương thành công'); },
    onError: () => toast.error('Lỗi thêm chương'),
  });

  const deleteSection = useMutation({
    mutationFn: (sectionId: string) => api.delete(`/admin/sections/${sectionId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-course', id] }); toast.success('✓ Đã xóa chương'); },
  });

  const addLesson = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: any }) =>
      api.post(`/admin/sections/${sectionId}/lessons`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setAddingLesson(null);
      setNewLesson({ title: '', videoUrl: '', duration: 10, isFree: false });
      toast.success('✓ Thêm bài học thành công');
    },
    onError: () => toast.error('Lỗi thêm bài học'),
  });

  const deleteLesson = useMutation({
    mutationFn: (lessonId: string) => api.delete(`/admin/lessons/${lessonId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-course', id] }); toast.success('✓ Đã xóa bài học'); },
  });

  const toggleSection = (sid: string) => {
    setOpenSections(prev => { const s = new Set(prev); s.has(sid) ? s.delete(sid) : s.add(sid); return s; });
  };

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  if (isLoading) return <><Navbar /><div className="max-w-3xl mx-auto px-6 py-12"><div className="h-64 bg-card rounded-[14px] animate-pulse" /></div></>;

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-[#64748b] mb-6 flex-wrap">
          <Link href="/admin/courses" className="hover:text-[#e2e8f0]">Khóa học</Link>
          <ChevronRight size={13} />
          <span className="text-[#e2e8f0] truncate max-w-[200px]">{course?.title}</span>
          <ChevronRight size={13} />
          <span className="text-acc">Bài học</span>
        </div>

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[20px] font-bold">Nội dung khóa học</h1>
          <div className="flex gap-2">
            <Link href={`/admin/courses/${id}/quiz`} className="btn-secondary text-[12px] py-2 px-3">📝 Quiz</Link>
            <Link href={`/admin/courses/${id}/edit`} className="btn-secondary text-[12px] py-2 px-3">✏️ Sửa info</Link>
          </div>
        </div>

        {/* Sections list */}
        <div className="space-y-3 mb-4">
          {course?.sections?.map((sec: any, si: number) => (
            <div key={sec.id} className="bg-card border border-border rounded-[12px] overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#1e1e2e] transition-colors"
                   onClick={() => toggleSection(sec.id)}>
                <GripVertical size={14} className="text-[#64748b]" />
                <span className="font-mono text-[11px] text-acc bg-[rgba(0,212,255,0.08)] px-2 py-0.5 rounded">
                  Chương {si + 1}
                </span>
                <span className="flex-1 font-semibold text-[14px]">{sec.title}</span>
                <span className="text-[11px] text-[#64748b]">{sec.lessons?.length || 0} bài</span>
                <button onClick={(e) => { e.stopPropagation(); if(confirm('Xóa chương này?')) deleteSection.mutate(sec.id); }}
                        className="p-1.5 text-red-400 hover:bg-[rgba(239,68,68,0.1)] rounded transition-colors">
                  <Trash2 size={13} />
                </button>
                {openSections.has(sec.id) ? <ChevronDown size={14} className="text-[#64748b]" /> : <ChevronRight size={14} className="text-[#64748b]" />}
              </div>

              {/* Lessons */}
              {openSections.has(sec.id) && (
                <div className="border-t border-border">
                  {sec.lessons?.map((lesson: any, li: number) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-[rgba(255,255,255,0.015)] text-[13px]">
                      <GripVertical size={13} className="text-[#64748b]" />
                      <PlayCircle size={14} className="text-[#64748b] shrink-0" />
                      <span className="flex-1">{li + 1}. {lesson.title}</span>
                      {lesson.isFree && <span className="badge badge-green text-[10px]">Free</span>}
                      {lesson.videoUrl && (
                        <span title={lesson.videoUrl}>
                          {lesson.videoUrl.includes('youtube') || lesson.videoUrl.includes('youtu.be')
                            ? <Youtube size={13} className="text-red-400" />
                            : <PlayCircle size={13} className="text-acc" />}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-[#64748b]">{lesson.duration}m</span>
                      <button onClick={() => { if(confirm('Xóa bài học này?')) deleteLesson.mutate(lesson.id); }}
                              className="p-1 text-red-400 hover:bg-[rgba(239,68,68,0.1)] rounded transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Add lesson form */}
                  {addingLesson === sec.id ? (
                    <div className="p-4 bg-[rgba(0,212,255,0.03)] space-y-3">
                      <div>
                        <label className="label">Tên bài học *</label>
                        <input value={newLesson.title} onChange={e => setNewLesson(p => ({...p, title: e.target.value}))}
                               placeholder="VD: Giới thiệu về Python" className="input text-[13px]" />
                      </div>
                      <div>
                        <label className="label">Link video (YouTube hoặc Cloudinary)</label>
                        <input value={newLesson.videoUrl} onChange={e => setNewLesson(p => ({...p, videoUrl: e.target.value}))}
                               placeholder="https://youtube.com/watch?v=... hoặc https://res.cloudinary.com/..."
                               className="input text-[13px] font-mono" />
                        {newLesson.videoUrl && getYoutubeId(newLesson.videoUrl) && (
                          <div className="mt-2 rounded-[8px] overflow-hidden aspect-video">
                            <iframe src={`https://www.youtube.com/embed/${getYoutubeId(newLesson.videoUrl)}`}
                                    className="w-full h-full" allowFullScreen />
                          </div>
                        )}
                        <p className="text-[11px] text-[#64748b] mt-1">Để trống nếu chưa có video</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Thời lượng (phút)</label>
                          <input type="number" value={newLesson.duration} onChange={e => setNewLesson(p => ({...p, duration: Number(e.target.value)}))}
                                 className="input text-[13px]" min="1" />
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={newLesson.isFree} onChange={e => setNewLesson(p => ({...p, isFree: e.target.checked}))}
                                   className="w-4 h-4 accent-[#00d4ff]" />
                            <span className="text-[13px]">Miễn phí (xem thử)</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          if (!newLesson.title.trim()) { toast.error('Nhập tên bài học!'); return; }
                          addLesson.mutate({ sectionId: sec.id, data: newLesson });
                        }} disabled={addLesson.isPending} className="btn-primary text-[12px] py-2 px-4">
                          {addLesson.isPending ? 'Đang thêm...' : '+ Thêm bài học'}
                        </button>
                        <button onClick={() => setAddingLesson(null)} className="btn-secondary text-[12px] py-2 px-4">Huỷ</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setAddingLesson(sec.id); setOpenSections(p => { const s = new Set(Array.from(p)); s.add(sec.id); return s; }); }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-[13px] text-acc hover:bg-[rgba(0,212,255,0.04)] transition-colors">
                      <Plus size={13} /> Thêm bài học
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add section */}
        {addingSection ? (
          <div className="bg-card border border-border2 rounded-[12px] p-4">
            <label className="label">Tên chương mới *</label>
            <input value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)}
                   placeholder="VD: Chương 1 — Bắt đầu với Python"
                   className="input mb-3" onKeyDown={e => e.key === 'Enter' && addSection.mutate(newSectionTitle)} />
            <div className="flex gap-2">
              <button onClick={() => { if (!newSectionTitle.trim()) { toast.error('Nhập tên chương!'); return; } addSection.mutate(newSectionTitle); }}
                      disabled={addSection.isPending} className="btn-primary text-[13px] py-2 px-4">
                {addSection.isPending ? 'Đang thêm...' : '+ Thêm chương'}
              </button>
              <button onClick={() => { setAddingSection(false); setNewSectionTitle(''); }} className="btn-secondary text-[13px] py-2 px-4">Huỷ</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingSection(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border2 rounded-[12px] text-[13px] text-[#64748b] hover:border-acc hover:text-acc transition-all">
            <Plus size={15} /> Thêm chương mới
          </button>
        )}

        <div className="mt-6 flex gap-3">
          <Link href={`/admin/courses/${id}/quiz`} className="btn-primary flex-1 text-center py-3">
            Tiếp theo: Thêm Quiz →
          </Link>
          <Link href="/admin/courses" className="btn-secondary px-6 py-3">Xong</Link>
        </div>
      </div>
    </>
  );
}
