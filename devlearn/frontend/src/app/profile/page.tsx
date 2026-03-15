// src/app/profile/page.tsx
'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();

  const { register: rp, handleSubmit: hsp, setValue: svp } = useForm<{ name: string }>();
  const { register: rw, handleSubmit: hsw } = useForm<{ currentPassword: string; newPassword: string }>();

  useEffect(() => {
    if (user) svp('name', user.name);
  }, [user]);

  const saveProfile = async (data: { name: string }) => {
    try {
      await api.patch('/users/profile', data);
      await fetchMe();
      toast.success('Đã cập nhật hồ sơ!');
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      await api.patch('/users/password', data);
      toast.success('Đã đổi mật khẩu!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-[22px] font-bold">Hồ sơ cá nhân</h1>

        {/* Avatar + info */}
        <div className="bg-card border border-border rounded-[14px] p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-[14px] bg-gradient-to-br from-acc2 to-acc flex items-center justify-center text-[24px] font-bold text-white shrink-0">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[16px]">{user?.name}</p>
            <p className="text-[13px] text-[#64748b] font-mono">{user?.email}</p>
            <span className="badge badge-blue mt-1">{user?.role}</span>
          </div>
        </div>

        {/* Edit name */}
        <div className="bg-card border border-border rounded-[14px] p-6">
          <h2 className="font-semibold text-[15px] mb-4">Thông tin cơ bản</h2>
          <form onSubmit={hsp(saveProfile)} className="space-y-4">
            <div>
              <label className="label">Họ & tên</label>
              <input {...rp('name')} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={user?.email ?? ''} disabled className="input opacity-50 cursor-not-allowed" />
            </div>
            <button type="submit" className="btn-primary">Lưu thay đổi</button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-card border border-border rounded-[14px] p-6">
          <h2 className="font-semibold text-[15px] mb-4">Đổi mật khẩu</h2>
          <form onSubmit={hsw(changePassword)} className="space-y-4">
            <div>
              <label className="label">Mật khẩu hiện tại</label>
              <input {...rw('currentPassword')} type="password" className="input" />
            </div>
            <div>
              <label className="label">Mật khẩu mới</label>
              <input {...rw('newPassword')} type="password" className="input" />
            </div>
            <button type="submit" className="btn-primary">Đổi mật khẩu</button>
          </form>
        </div>
      </div>
    </>
  );
}
