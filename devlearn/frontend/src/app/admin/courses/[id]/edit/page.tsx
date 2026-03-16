// src/app/admin/courses/[id]/edit/page.tsx
'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ChevronRight } from 'lucide-react';

const schema = z.object({
  title:       z.string().min(5),
  slug:        z.string().min(3).regex(/^[a-z0-9-]+$/),
  shortDesc:   z.string().min(10),
  description: z.string().min(20),
  price:       z.coerce.number().min(0),
  oldPrice:    z.coerce.number().optional(),
  level:       z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  categoryId:  z.string().min(1),
  tags:        z.string().optional(),
  isPublished: z.boolean().optional(),
});
type Form = z.infer<typeof schema>;

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: course } = useQuery({
    queryKey: ['admin-course', id],
    queryFn: async () => { const { data } = await api.get(`/admin/courses/${id}`); return data; },
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const { data } = await api.get('/courses/categories'); return data; },
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (course) reset({
      title: course.title, slug: course.slug,
      shortDesc: course.shortDesc, description: course.description,
      price: course.price, oldPrice: course.oldPrice || undefined,
      level: course.level, categoryId: course.categoryId,
      tags: course.tags?.join(', ') || '',
      isPublished: course.isPublished,
    });
  }, [course]);

  const onSubmit = async (data: Form) => {
    try {
      const tags = data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
      await api.patch(`/admin/courses/${id}`, { ...data, tags });
      toast.success('✓ Đã cập nhật khóa học');
      router.push('/admin/courses');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi cập nhật');
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-[13px] text-[#64748b] mb-6">
          <Link href="/admin/courses" className="hover:text-[#e2e8f0]">Khóa học</Link>
          <ChevronRight size={13} />
          <span className="text-[#e2e8f0] truncate max-w-[200px]">{course?.title}</span>
          <ChevronRight size={13} />
          <span className="text-acc">Sửa thông tin</span>
        </div>

        <h1 className="text-[22px] font-bold mb-6">Sửa khóa học</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label">Tên khóa học *</label>
            <input {...register('title')} className="input" />
            {errors.title && <p className="text-red-400 text-[11px] mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label">Slug *</label>
            <input {...register('slug')} className="input font-mono text-[13px]" />
            {errors.slug && <p className="text-red-400 text-[11px] mt-1">{errors.slug.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Danh mục *</label>
              <select {...register('categoryId')} className="input">
                {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Giá (VNĐ) *</label>
              <input {...register('price')} type="number" className="input font-mono" />
            </div>
            <div>
              <label className="label">Giá gốc</label>
              <input {...register('oldPrice')} type="number" className="input font-mono" />
            </div>
          </div>
          <div>
            <label className="label">Tags</label>
            <input {...register('tags')} placeholder="Python, OOP, CLI" className="input" />
          </div>
          <div>
            <label className="label">Mô tả ngắn *</label>
            <input {...register('shortDesc')} className="input" />
            {errors.shortDesc && <p className="text-red-400 text-[11px] mt-1">{errors.shortDesc.message}</p>}
          </div>
          <div>
            <label className="label">Mô tả đầy đủ *</label>
            <textarea {...register('description')} rows={5} className="input resize-none" />
            {errors.description && <p className="text-red-400 text-[11px] mt-1">{errors.description.message}</p>}
          </div>
          <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-[10px]">
            <input type="checkbox" {...register('isPublished')} id="pub" className="w-4 h-4 accent-[#00d4ff]" />
            <label htmlFor="pub" className="text-[13px] font-medium cursor-pointer">Published</label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 py-3">
              {isSubmitting ? 'Đang lưu...' : '✓ Lưu thay đổi'}
            </button>
            <Link href="/admin/courses" className="btn-secondary px-6 py-3">Huỷ</Link>
          </div>
        </form>
      </div>
    </>
  );
}
