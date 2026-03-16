'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import api from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

export default function NewCoursePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', shortDesc: '', description: '',
    price: 499000, originalPrice: 0,
    level: 'BEGINNER', tags: '', thumbnail: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') router.push('/');
  }, [user]);

  const handleCreate = async () => {
    if (!form.title.trim()) { setError('Tên khóa học không được để trống'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/courses', {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        slug: form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now(),
      });
      router.push(`/admin/courses/${res.data.course.id}/lessons`);
    } catch (err) {
      console.error(err);
      setError('Không thể tạo khóa học. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border2 bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses" className="text-[#94a3b8] hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[11px] text-[#64748b] uppercase tracking-wider">Tạo khóa học mới</p>
            <h1 className="text-[16px] font-semibold">Khóa học mới</h1>
          </div>
        </div>
        <button onClick={handleCreate} disabled={saving}
          className="px-5 py-1.5 bg-acc text-black text-[13px] font-medium rounded-lg disabled:opacity-50">
          {saving ? 'Đang tạo...' : 'Tạo & thêm bài học →'}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-[13px]">{error}</div>}

        <div className="bg-card border border-border2 rounded-xl p-5 space-y-4">
          <h2 className="text-[13px] font-semibold text-[#94a3b8] uppercase tracking-wider">Thông tin cơ bản</h2>

          <div>
            <label className="block text-[12px] text-[#94a3b8] mb-1.5">Tên khóa học *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[14px] focus:border-acc outline-none transition-colors"
              placeholder="VD: Python cho người mới bắt đầu" autoFocus />
          </div>

          <div>
            <label className="block text-[12px] text-[#94a3b8] mb-1.5">Mô tả ngắn</label>
            <input value={form.shortDesc} onChange={e => setForm(p => ({ ...p, shortDesc: e.target.value }))}
              className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[14px] focus:border-acc outline-none transition-colors"
              placeholder="1-2 câu tóm tắt" />
          </div>

          <div>
            <label className="block text-[12px] text-[#94a3b8] mb-1.5">Mô tả chi tiết</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={4} className="w-full bg-background border border-border2 rounded-lg px-3 py-2 text-[14px] focus:border-acc outline-none transition-colors resize-none"
              placeholder="Bạn sẽ học được gì, yêu cầu đầu vào..." />
          </div>

          <div>
            <label className="block text-[12px] text-[#94a3b8] mb-1.5">Link ảnh bìa</label>
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
              placeholder="Python, OOP, Backend" />
          </div>
        </div>
      </div>
    </div>
  );
}