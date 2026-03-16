'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/axios';
import { ArrowLeft, Save } from 'lucide-react';

interface CourseForm {
  title: string;
  shortDesc: string;
  description: string;
  price: number;
  originalPrice: number;
  level: string;
  tags: string;
  thumbnail: string;
  isPublished: boolean;
}

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const courseId = params.id as string;

  const [form, setForm] = useState<CourseForm>({
    title: '', shortDesc: '', description: '',
    price: 0, originalPrice: 0, level: 'BEGINNER',
    tags: '', thumbnail: '', isPublished: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/'); return; }
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${courseId}`);
      const c = res.data.course;
      setForm({
        title: c.title || '',
        shortDesc: c.shortDesc || '',
        description: c.description || '',
        price: c.price || 0,
        originalPrice: c.originalPrice || 0,
        level: c.level || 'BEGINNER',
        tags: Array.isArray(c.tags) ? c.tags.join(', ') : (c.tags || ''),
        thumbnail: c.thumbnail || '',
        isPublished: c.isPublished || false,
      });
    } catch (err) {
      console.error(err);
      setError('Không thể tải thông tin khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Tên khóa học không được để trống'); return; }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/courses/${courseId}`, {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setSuccess('Đã lưu thay đổi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi lưu. Vui lòng thử lại.');
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
      <div className="border-b border-border2 bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses" className="text-[#94a3b8] hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[11px] text-[#64748b] uppercase tracking-wider">Chỉnh sửa khóa học</p>
            <h1 className="text-[16px] font-semibold">{form.title || 'Khóa học'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/courses/${courseId}/lessons`}
            className="px-3 py-1.5 text-[12px] border border-border2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            Bài học
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 bg-acc text-black text-[13px] font-medium rounded-lg disabled:opacity-50">
            <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-[13px]">{error}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-[13px]">{success}</div>}

        <div className="bg-card border border-border2 rounded-xl p-5 space-y-4">
          <h2 className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-wider">Thông tin cơ bản</h2>

          <div>
            <label className="block text-[12px] text-[#94a3b8] mb-1.5">Tên khóa học *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[14px] focus:border-acc outline-none transition-colors"
              placeholder="VD: Python cho người mới bắt đầu" />
          </div>

          <div>
            <label className="block text-[12px] text-[#94a3b8] mb-1.5">Mô tả ngắn</label>
            <input value={form.shortDesc} onChange={e => setForm(p => ({ ...p, shortDesc: e.target.value }))}
              className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[14px] focus:border-acc outline-none transition-colors"
              placeholder="1-2 câu tóm tắt khóa học" />
          </div>

          <div>
            <label className="block text-[12px] text-[#94a3b8] mb-1.5">Mô tả chi tiết</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={5} className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[14px] focus:border-acc outline-none transition-colors resize-none"
              placeholder="Nội dung khóa học, bạn sẽ học được gì..." />
          </div>

          <div>
            <label className="block text-[12px] text-[#94a3b8] mb-1.5">Link thumbnail (ảnh bìa)</label>
            <input value={form.thumbnail} onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))}
              className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[14px] focus:border-acc outline-none transition-colors"
              placeholder="https://..." />
          </div>
        </div>

        <div className="bg-card border border-border2 rounded-xl p-5 space-y-4">
          <h2 className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-wider">Giá & Cấp độ</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-[#94a3b8] mb-1.5">Giá bán (VNĐ)</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[14px] focus:border-acc outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-[12px] text-[#94a3b8] mb-1.5">Giá gốc (VNĐ)</label>
              <input type="number" value={form.originalPrice} onChange={e => setForm(p => ({ ...p, originalPrice: Number(e.target.value) }))}
                className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[14px] focus:border-acc outline-none transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-[#94a3b8] mb-1.5">Cấp độ</label>
            <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
              className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[14px] focus:border-acc outline-none transition-colors">
              <option value="BEGINNER">Người mới bắt đầu</option>
              <option value="INTERMEDIATE">Trung cấp</option>
              <option value="ADVANCED">Nâng cao</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] text-[#94a3b8] mb-1.5">Tags (cách nhau bằng dấu phẩy)</label>
            <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[14px] focus:border-acc outline-none transition-colors"
              placeholder="Python, OOP, Beginner" />
          </div>
        </div>

        <div className="bg-card border border-border2 rounded-xl p-5">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-[14px] font-medium">Công khai khóa học</p>
              <p className="text-[12px] text-[#64748b] mt-0.5">Học viên có thể tìm và mua khóa học này</p>
            </div>
            <div onClick={() => setForm(p => ({ ...p, isPublished: !p.isPublished }))}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${form.isPublished ? 'bg-acc' : 'bg-[#334155]'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.isPublished ? 'left-6' : 'left-1'}`} />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}