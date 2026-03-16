// src/app/admin/courses/new/page.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  title:       z.string().min(5, 'Tối thiểu 5 ký tự'),
  slug:        z.string().min(3).regex(/^[a-z0-9-]+$/, 'Chỉ chữ thường, số và dấu -'),
  shortDesc:   z.string().min(10, 'Tối thiểu 10 ký tự'),
  description: z.string().min(20, 'Tối thiểu 20 ký tự'),
  price:       z.coerce.number().min(0),
  oldPrice:    z.coerce.number().optional(),
  level:       z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  categoryId:  z.string().min(1, 'Chọn danh mục'),
  tags:        z.string().optional(),
  isPublished: z.boolean().optional(),
});
type Form = z.infer<typeof schema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const { data } = await api.get('/courses/categories'); return data; },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { level: 'BEGINNER', isPublished: false },
  });

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-');
    setValue('slug', slug);
  };

  const onSubmit = async (data: Form) => {
    try {
      const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const res = await api.post('/admin/courses', { ...data, tags });
      toast.success('✓ Tạo khóa học thành công!');
      router.push(`/admin/courses/${res.data.id}/lessons`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi tạo khóa học');
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-[#64748b] mb-6">
          <Link href="/admin" className="hover:text-[#e2e8f0]">Admin</Link>
          <ChevronRight size={13} />
          <Link href="/admin/courses" className="hover:text-[#e2e8f0]">Khóa học</Link>
          <ChevronRight size={13} />
          <span className="text-[#e2e8f0]">Thêm mới</span>
        </div>

        <h1 className="text-[22px] font-bold mb-6">Tạo khóa học mới</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <div>
            <label className="label">Tên khóa học *</label>
            <input {...register('title')} onChange={(e) => { register('title').onChange(e); handleTitleChange(e); }}
                   placeholder="VD: Python Fundamentals cho người mới bắt đầu"
                   className="input" />
            {errors.title && <p className="text-red-400 text-[11px] mt-1">{errors.title.message}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="label">Slug (URL) *</label>
            <input {...register('slug')} placeholder="python-fundamentals" className="input font-mono text-[13px]" />
            {errors.slug && <p className="text-red-400 text-[11px] mt-1">{errors.slug.message}</p>}
            <p className="text-[11px] text-[#64748b] mt-1">devlearn.vn/courses/<span className="text-acc">{watch('slug') || 'ten-khoa-hoc'}</span></p>
          </div>

          {/* Category + Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Danh mục *</label>
              <select {...register('categoryId')} className="input">
                <option value="">-- Chọn danh mục --</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                {/* Fallback nếu API chưa có endpoint categories */}
                {!categories && <>
                  <option value="backend">Backend</option>
                  <option value="frontend">Frontend</option>
                  <option value="devops">DevOps</option>
                  <option value="data-ai">Data / AI</option>
                </>}
              </select>
              {errors.categoryId && <p className="text-red-400 text-[11px] mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className="label">Cấp độ *</label>
              <select {...register('level')} className="input">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          {/* Price + Old Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Giá (VNĐ) *</label>
              <input {...register('price')} type="number" placeholder="499000" className="input font-mono" />
              {errors.price && <p className="text-red-400 text-[11px] mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="label">Giá gốc (để trống nếu không có)</label>
              <input {...register('oldPrice')} type="number" placeholder="999000" className="input font-mono" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label">Tags (cách nhau bằng dấu phẩy)</label>
            <input {...register('tags')} placeholder="Python, OOP, CLI" className="input" />
            <p className="text-[11px] text-[#64748b] mt-1">VD: Python, OOP, CLI</p>
          </div>

          {/* Short description */}
          <div>
            <label className="label">Mô tả ngắn *</label>
            <input {...register('shortDesc')} placeholder="Học Python từ zero đến hero với các dự án thực tế." className="input" />
            {errors.shortDesc && <p className="text-red-400 text-[11px] mt-1">{errors.shortDesc.message}</p>}
          </div>

          {/* Full description */}
          <div>
            <label className="label">Mô tả đầy đủ *</label>
            <textarea {...register('description')} rows={5}
                      placeholder="Khóa học này bao gồm... Bạn sẽ học được..."
                      className="input resize-none leading-relaxed" />
            {errors.description && <p className="text-red-400 text-[11px] mt-1">{errors.description.message}</p>}
          </div>

          {/* Publish toggle */}
          <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-[10px]">
            <input type="checkbox" {...register('isPublished')} id="pub" className="w-4 h-4 accent-[#00d4ff]" />
            <div>
              <label htmlFor="pub" className="text-[13px] font-medium cursor-pointer">Publish ngay</label>
              <p className="text-[11px] text-[#64748b]">Bỏ chọn để lưu nháp trước</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 py-3">
              {isSubmitting ? 'Đang tạo...' : '✓ Tạo khóa học → Thêm bài học'}
            </button>
            <Link href="/admin/courses" className="btn-secondary px-6 py-3">Huỷ</Link>
          </div>
        </form>
      </div>
    </>
  );
}
