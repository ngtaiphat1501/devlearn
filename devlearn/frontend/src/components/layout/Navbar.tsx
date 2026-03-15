// src/components/layout/Navbar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils';
import { Code2, LayoutDashboard, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { href: '/courses', label: 'Khóa học' },
    ...(user ? [{ href: '/dashboard', label: 'Học của tôi' }] : []),
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[rgba(10,10,15,0.96)] backdrop-blur-[14px] border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-2">
          <div className="w-8 h-8 rounded-[7px] bg-gradient-to-br from-acc to-acc2 flex items-center justify-center">
            <Code2 size={15} className="text-black" />
          </div>
          <span className="font-mono font-medium text-[15px]">
            Dev<span className="text-acc">Learn</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex gap-0.5 flex-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-3 py-1.5 rounded-[7px] text-[13px] font-medium transition-all duration-200',
                pathname.startsWith(l.href)
                  ? 'bg-[rgba(0,212,255,0.08)] text-acc'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1e1e2e]'
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-border2 hover:border-acc transition-all text-sm"
              >
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-acc2 to-acc flex items-center justify-center text-[10px] font-bold text-white">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[13px] font-medium max-w-[100px] truncate">{user.name.split(' ').at(-1)}</span>
                <ChevronDown size={13} className="text-[#64748b]" />
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-10 w-52 bg-surface border border-border2 rounded-[12px] shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-[13px] font-semibold truncate">{user.name}</p>
                    <p className="text-[11px] text-[#64748b] truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <DropItem href="/dashboard" icon={<LayoutDashboard size={14} />} label="Dashboard" onClick={() => setDropOpen(false)} />
                    <DropItem href="/profile" icon={<User size={14} />} label="Hồ sơ" onClick={() => setDropOpen(false)} />
                    {user.role === 'ADMIN' && (
                      <DropItem href="/admin" icon={<Settings size={14} />} label="Admin Panel" onClick={() => setDropOpen(false)} />
                    )}
                  </div>
                  <div className="py-1 border-t border-border">
                    <button
                      onClick={() => { setDropOpen(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                    >
                      <LogOut size={14} /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost text-[13px]">Đăng nhập</Link>
              <Link href="/auth/register" className="btn-primary text-[13px]">Bắt đầu học</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function DropItem({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1e1e2e] transition-colors"
    >
      {icon} {label}
    </Link>
  );
}
