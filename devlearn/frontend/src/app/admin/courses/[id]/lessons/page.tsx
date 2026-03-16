'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/axios';
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical, Video, FileText, Save, ArrowLeft } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  videoUrl: string | null;
  duration: number;
  position: number;
  isFree: boolean;
  content: string | null;
}

interface Section {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  sections: Section[];
}

export default function AdminCourseLessonsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newLesson, setNewLesson] = useState({ title: '', videoUrl: '', duration: 10, isFree: false, content: '' });
  const [saving, setSaving] = useState(false);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editLessonData, setEditLessonData] = useState<Partial<Lesson>>({});

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/'); return; }
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/manage`);
      setCourse(res.data.course);
      const open: Record<string, boolean> = {};
      res.data.course.sections?.forEach((s: Section) => { open[s.id] = true; });
      setOpenSections(open);
    } catch {
      try {
        const res = await api.get(`/courses/${courseId}`);
        setCourse(res.data.course);
      } catch (err) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: true }));
  };

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/courses/${courseId}/sections`, {
        title: newSectionTitle,
        position: (course?.sections?.length || 0) + 1,
      });
      setCourse(prev => prev ? {
        ...prev,
        sections: [...(prev.sections || []), { ...res.data.section, lessons: [] }]
      } : prev);
      setNewSectionTitle('');
      setAddingSection(false);
      openSection(res.data.section.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Xóa chương này và tất cả bài học bên trong?')) return;
    try {
      await api.delete(`/courses/${courseId}/sections/${sectionId}`);
      setCourse(prev => prev ? {
        ...prev,
        sections: prev.sections.filter(s => s.id !== sectionId)
      } : prev);
    } catch (err) {
      console.error(err);
    }
  };

  const addLesson = async (sectionId: string) => {
    if (!newLesson.title.trim()) return;
    setSaving(true);
    try {
      const section = course?.sections.find(s => s.id === sectionId);
      const res = await api.post(`/courses/${courseId}/sections/${sectionId}/lessons`, {
        ...newLesson,
        position: (section?.lessons?.length || 0) + 1,
      });
      setCourse(prev => prev ? {
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId ? { ...s, lessons: [...(s.lessons || []), res.data.lesson] } : s
        )
      } : prev);
      setNewLesson({ title: '', videoUrl: '', duration: 10, isFree: false, content: '' });
      setAddingLesson(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (sectionId: string, lessonId: string) => {
    if (!confirm('Xóa bài học này?')) return;
    try {
      await api.delete(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);
      setCourse(prev => prev ? {
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId ? { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) } : s
        )
      } : prev);
    } catch (err) {
      console.error(err);
    }
  };

  const saveLesson = async (sectionId: string, lessonId: string) => {
    setSaving(true);
    try {
      await api.patch(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, editLessonData);
      setCourse(prev => prev ? {
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId ? {
            ...s,
            lessons: s.lessons.map(l => l.id === lessonId ? { ...l, ...editLessonData } : l)
          } : s
        )
      } : prev);
      setEditingLesson(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-acc border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border2 bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses" className="text-[#94a3b8] hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[11px] text-[#64748b] uppercase tracking-wider">Quản lý bài học</p>
            <h1 className="text-[16px] font-semibold">{course?.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/courses/${courseId}/quiz`}
            className="px-3 py-1.5 text-[12px] border border-border2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            Quản lý Quiz
          </Link>
          <Link href={`/admin/courses/${courseId}/edit`}
            className="px-3 py-1.5 text-[12px] border border-border2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            Sửa thông tin
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Sections */}
        <div className="space-y-3">
          {(course?.sections || []).map((sec, si) => (
            <div key={sec.id} className="border border-border2 rounded-xl overflow-hidden bg-card">
              {/* Section Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(255,255,255,0.03)]">
                <GripVertical size={14} className="text-[#475569] cursor-grab" />
                <button onClick={() => toggleSection(sec.id)} className="flex items-center gap-2 flex-1 text-left">
                  {openSections[sec.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="text-[13px] font-medium">Chương {si + 1}: {sec.title}</span>
                  <span className="text-[11px] text-[#64748b] ml-auto">{sec.lessons?.length || 0} bài</span>
                </button>
                <button onClick={() => deleteSection(sec.id)} className="text-[#ef4444] hover:text-red-400 p-1 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Lessons */}
              {openSections[sec.id] && (
                <div className="divide-y divide-border2">
                  {(sec.lessons || []).map((lesson, li) => (
                    <div key={lesson.id} className="px-4 py-3">
                      {editingLesson === lesson.id ? (
                        <div className="space-y-2">
                          <input value={editLessonData.title || ''} onChange={e => setEditLessonData(p => ({ ...p, title: e.target.value }))}
                            className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[13px]" placeholder="Tên bài học" />
                          <input value={editLessonData.videoUrl || ''} onChange={e => setEditLessonData(p => ({ ...p, videoUrl: e.target.value }))}
                            className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[13px]" placeholder="Link video YouTube/Cloudinary" />
                          <div className="flex items-center gap-3">
                            <input type="number" value={editLessonData.duration || 0} onChange={e => setEditLessonData(p => ({ ...p, duration: Number(e.target.value) }))}
                              className="w-24 bg-background border border-border2 rounded-lg px-3 py-2 text-[13px]" placeholder="Phút" />
                            <label className="flex items-center gap-2 text-[12px] text-[#94a3b8]">
                              <input type="checkbox" checked={editLessonData.isFree || false} onChange={e => setEditLessonData(p => ({ ...p, isFree: e.target.checked }))} />
                              Miễn phí xem thử
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveLesson(sec.id, lesson.id)} disabled={saving}
                              className="flex items-center gap-1 px-3 py-1.5 bg-acc text-black text-[12px] font-medium rounded-lg disabled:opacity-50">
                              <Save size={12} /> Lưu
                            </button>
                            <button onClick={() => setEditingLesson(null)} className="px-3 py-1.5 border border-border2 text-[12px] rounded-lg">
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <GripVertical size={12} className="text-[#475569] cursor-grab" />
                          {lesson.videoUrl ? <Video size={13} className="text-acc shrink-0" /> : <FileText size={13} className="text-[#64748b] shrink-0" />}
                          <span className="text-[13px] flex-1">{li + 1}. {lesson.title}</span>
                          {lesson.isFree && <span className="text-[10px] bg-[rgba(0,212,255,0.1)] text-acc px-2 py-0.5 rounded-full">Free</span>}
                          <span className="text-[11px] text-[#64748b]">{lesson.duration}p</span>
                          <button onClick={() => { setEditingLesson(lesson.id); setEditLessonData(lesson); }}
                            className="text-[11px] text-[#94a3b8] hover:text-foreground px-2 py-1 transition-colors">Sửa</button>
                          <button onClick={() => deleteLesson(sec.id, lesson.id)} className="text-[#ef4444] hover:text-red-400 p-1 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Lesson Form */}
                  {addingLesson === sec.id ? (
                    <div className="px-4 py-3 bg-[rgba(0,212,255,0.02)] space-y-2">
                      <input value={newLesson.title} onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))}
                        className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[13px]" placeholder="Tên bài học *" autoFocus />
                      <input value={newLesson.videoUrl} onChange={e => setNewLesson(p => ({ ...p, videoUrl: e.target.value }))}
                        className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[13px]" placeholder="Link video YouTube (https://youtube.com/watch?v=...)" />
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input type="number" value={newLesson.duration} onChange={e => setNewLesson(p => ({ ...p, duration: Number(e.target.value) }))}
                            className="w-20 bg-background border border-border2 rounded-lg px-3 py-2 text-[13px]" min={1} />
                          <span className="text-[12px] text-[#64748b]">phút</span>
                        </div>
                        <label className="flex items-center gap-2 text-[12px] text-[#94a3b8]">
                          <input type="checkbox" checked={newLesson.isFree} onChange={e => setNewLesson(p => ({ ...p, isFree: e.target.checked }))} />
                          Xem thử miễn phí
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => addLesson(sec.id)} disabled={saving || !newLesson.title.trim()}
                          className="flex items-center gap-1 px-3 py-1.5 bg-acc text-black text-[12px] font-medium rounded-lg disabled:opacity-50">
                          <Plus size={12} /> Thêm bài
                        </button>
                        <button onClick={() => setAddingLesson(null)} className="px-3 py-1.5 border border-border2 text-[12px] rounded-lg">Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setAddingLesson(sec.id); openSection(sec.id); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-[13px] text-acc hover:bg-[rgba(0,212,255,0.04)] transition-colors">
                      <Plus size={13} /> Thêm bài học
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Section */}
        <div className="mt-4">
          {addingSection ? (
            <div className="border border-border2 rounded-xl p-4 bg-card space-y-3">
              <input value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)}
                className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[13px]"
                placeholder="Tên chương mới *" autoFocus
                onKeyDown={e => e.key === 'Enter' && addSection()} />
              <div className="flex gap-2">
                <button onClick={addSection} disabled={saving || !newSectionTitle.trim()}
                  className="flex items-center gap-1 px-4 py-2 bg-acc text-black text-[13px] font-medium rounded-lg disabled:opacity-50">
                  <Plus size={13} /> Thêm chương
                </button>
                <button onClick={() => { setAddingSection(false); setNewSectionTitle(''); }}
                  className="px-4 py-2 border border-border2 text-[13px] rounded-lg">Hủy</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingSection(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border2 rounded-xl text-[13px] text-[#64748b] hover:text-acc hover:border-acc transition-colors">
              <Plus size={14} /> Thêm chương mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
}