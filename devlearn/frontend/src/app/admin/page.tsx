// src/app/admin/page.tsx
'use client';
import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAdminStats, useAdminUsers, useGrantAccess, useToggleUserStatus } from '@/hooks/useOrder';
import { useCourses } from '@/hooks/useCourses';
import { formatPrice, formatDate } from '@/lib/utils';
import { Users, BookOpen, ShoppingCart, TrendingUp, Search, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'users' | 'courses';

export default function AdminPage() {
  const [tab, setTab]       = useState<Tab>('overview');
  const [search, setSearch] = useState('');

  const { data: stats } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(search);
  const { data: coursesData } = useCourses({ limit: 50 });
  const { mutate: grantAccess } = useGrantAccess();
  const { mutate: toggleStatus } = useToggleUserStatus();

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold flex items-center gap-2"><Shield size={20} className="text-acc" /> Admin Panel</h1>
          <p className="text-[12px] text-[#64748b] font-mono mt-1">// DevLearn management system</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-border mb-7">
          {(['overview','users','courses'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-all ${
                      tab === t ? 'border-acc text-acc' : 'border-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
                    }`}>
              {{ overview:'📊 Tổng quan', users:'👥 Học viên', courses:'📚 Khóa học' }[t]}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label:'Tổng học viên', value: stats?.totalUsers ?? 0, icon: <Users size={16}/>, color:'text-acc' },
                { label:'Khóa học', value: stats?.totalCourses ?? 0, icon: <BookOpen size={16}/>, color:'text-purple-400' },
                { label:'Đơn hàng', value: stats?.totalOrders ?? 0, icon: <ShoppingCart size={16}/>, color:'text-yellow-400' },
                { label:'Doanh thu', value: formatPrice(stats?.totalRevenue ?? 0), icon: <TrendingUp size={16}/>, color:'text-acc3' },
              ].map((k) => (
                <div key={k.label} className="bg-card border border-border rounded-[12px] p-4">
                  <div className={`font-mono text-[24px] font-medium ${k.color}`}>{k.value}</div>
                  <div className="text-[12px] text-[#64748b] mt-1 flex items-center gap-1.5">{k.icon}{k.label}</div>
                </div>
              ))}
            </div>

            {/* Revenue by course */}
            <div className="bg-card border border-border rounded-[12px] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border font-semibold text-[14px]">Doanh thu theo khóa học</div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    {['Khóa học','Đơn hàng','Doanh thu'].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#64748b] uppercase tracking-[0.5px] font-mono bg-[rgba(0,0,0,0.2)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats?.revenueData?.map((r: any) => (
                    <tr key={r.courseId} className="border-b border-border hover:bg-[rgba(255,255,255,0.015)] transition-colors">
                      <td className="px-5 py-3 font-medium">{r.title}</td>
                      <td className="px-5 py-3 font-mono text-[#94a3b8]">{r.orders}</td>
                      <td className="px-5 py-3 font-mono text-acc3 font-medium">{formatPrice(r.revenue ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent orders */}
            <div className="bg-card border border-border rounded-[12px] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border font-semibold text-[14px]">Đơn hàng gần đây</div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    {['Học viên','Khóa học','Ngày','Số tiền'].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#64748b] uppercase tracking-[0.5px] font-mono bg-[rgba(0,0,0,0.2)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentOrders?.map((o: any) => (
                    <tr key={o.id} className="border-b border-border hover:bg-[rgba(255,255,255,0.015)]">
                      <td className="px-5 py-3">
                        <div className="font-medium">{o.user?.name}</div>
                        <div className="text-[11px] text-[#64748b] font-mono">{o.user?.email}</div>
                      </td>
                      <td className="px-5 py-3 text-[#94a3b8]">{o.items?.[0]?.course?.title}</td>
                      <td className="px-5 py-3 font-mono text-[11px] text-[#64748b]">{formatDate(o.paidAt ?? o.createdAt)}</td>
                      <td className="px-5 py-3 font-mono text-acc3 font-medium">{formatPrice(o.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div>
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="// tìm theo tên, email..."
                className="input pl-9 font-mono text-[13px]"
              />
            </div>
            <div className="bg-card border border-border rounded-[12px] overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    {['Học viên','Khóa học đã mua','Trạng thái','Mở quyền','Active'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-[0.5px] font-mono bg-[rgba(0,0,0,0.2)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-[#64748b]">Đang tải...</td></tr>
                  ) : usersData?.data?.map((u: any) => (
                    <tr key={u.id} className="border-b border-border hover:bg-[rgba(255,255,255,0.015)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-[7px] bg-gradient-to-br from-acc2 to-acc flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                            {u.name.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{u.name}</div>
                            <div className="text-[11px] text-[#64748b] font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-acc text-[12px]">{u._count?.enrollments ?? 0} khóa</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                          {u.isActive ? '● active' : '● inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {coursesData?.data?.slice(0,4).map((c: any) => (
                            <button key={c.id}
                                    onClick={() => grantAccess({ userId: u.id, courseId: c.id }, { onSuccess: () => toast.success(`✓ Đã mở "${c.title}" cho ${u.name}`) })}
                                    className="px-2 py-0.5 bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.18)] rounded text-[10px] text-acc font-mono hover:bg-[rgba(0,212,255,0.15)] transition-colors">
                              {c.slug.split('-').slice(0,1).join('')}+
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleStatus(u.id, { onSuccess: (d: any) => toast(d.isActive ? '✓ Đã kích hoạt' : '✓ Đã vô hiệu hóa') })}
                                className="text-[#64748b] hover:text-[#e2e8f0] transition-colors">
                          {u.isActive ? <ToggleRight size={22} className="text-acc3" /> : <ToggleLeft size={22} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── COURSES ── */}
        {tab === 'courses' && (
          <div className="bg-card border border-border rounded-[12px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  {['Khóa học','Danh mục','Level','Giá','Học viên','Active'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-[0.5px] font-mono bg-[rgba(0,0,0,0.2)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coursesData?.data?.map((c: any) => (
                  <tr key={c.id} className="border-b border-border hover:bg-[rgba(255,255,255,0.015)]">
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-acc">{c.category?.name}</td>
                    <td className="px-4 py-3"><span className={`badge ${{ BEGINNER:'badge-green', INTERMEDIATE:'badge-yellow', ADVANCED:'badge-purple' }[c.level as string]}`}>{c.level}</span></td>
                    <td className="px-4 py-3 font-mono">{formatPrice(c.price)}</td>
                    <td className="px-4 py-3 font-mono text-[#94a3b8]">{c.enrollmentCount ?? 0}</td>
                    <td className="px-4 py-3"><span className={`badge ${c.isPublished ? 'badge-green' : 'badge-red'}`}>{c.isPublished ? 'Published' : 'Draft'}</span></td>
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
