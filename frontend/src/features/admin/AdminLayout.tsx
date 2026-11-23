import { useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Building2, ClipboardCheck, FileClock, FileWarning, LogOut, Menu, UserPlus, Users, UserX, X, Hourglass } from 'lucide-react';
import { adminService } from '../../services/adminApi';
import { SteeringWheel } from '../../components/app/Brand';
import { cn } from '../../lib/utils';

export type AdminStats = {
  drivers: Record<'all' | 'incomplete' | 'completed' | 'rc_pending' | 'resubmission' | 'approved' | 'rejected', number>;
  fleet: { total: number; pending: number; approved: number; vehicles: number };
};

export const useAdminStats = () =>
  useQuery<AdminStats>({ queryKey: ['admin-stats'], queryFn: () => adminService.getStats().then((r) => r.data.data), refetchInterval: 60_000 });

export const DRIVER_BUCKETS = [
  { bucket: 'all', label: 'All registered', icon: Users },
  { bucket: 'incomplete', label: 'Profile incomplete', icon: Hourglass },
  { bucket: 'completed', label: 'Profile completed', icon: ClipboardCheck },
  { bucket: 'rc_pending', label: 'Waiting RC approval', icon: FileClock },
  { bucket: 'resubmission', label: 'Asked to re-upload', icon: FileWarning },
  { bucket: 'approved', label: 'Approved', icon: BadgeCheck },
  { bucket: 'rejected', label: 'Rejected', icon: UserX },
] as const;

const SideLink = ({ to, icon: Icon, label, count, active, onClick }: {
  to: string; icon: typeof Users; label: string; count?: number; active: boolean; onClick: () => void;
}) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors',
      active ? 'bg-brand-orange text-white shadow-gold' : 'text-slate-300 hover:bg-white/5 hover:text-white')}
  >
    <Icon className="h-[18px] w-[18px] shrink-0" />
    <span className="flex-1 truncate">{label}</span>
    {count !== undefined && (
      <span className={cn('min-w-[28px] rounded-full px-2 py-0.5 text-center text-[12px] font-bold', active ? 'bg-white/25' : 'bg-white/10 text-slate-200')}>{count}</span>
    )}
  </NavLink>
);

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: stats } = useAdminStats();
  if (!localStorage.getItem('adminToken')) return <Navigate to="/admin/login" replace />;

  const bucket = new URLSearchParams(location.search).get('bucket') ?? 'all';
  const onDrivers = location.pathname === '/admin/drivers';
  const close = () => setOpen(false);
  const logout = () => { localStorage.removeItem('adminToken'); navigate('/admin/login'); };

  const sidebar = (
    <aside className="flex h-full w-72 flex-col bg-gradient-to-b from-brand-navy to-brand-ink text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <SteeringWheel className="h-10 w-10" spoke="#FFF3E8" />
        <div>
          <p className="font-display text-[17px] font-bold leading-none">RAJ<span className="text-brand-orange">WORTHMAN</span></p>
          <p className="mt-1 text-[12px] text-slate-400">Admin panel</p>
        </div>
        <button className="ml-auto rounded-lg p-1.5 hover:bg-white/10 lg:hidden" onClick={close} aria-label="Close menu"><X className="h-5 w-5" /></button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 no-scrollbar">
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Drivers</p>
          {DRIVER_BUCKETS.map((b) => (
            <SideLink key={b.bucket} to={`/admin/drivers?bucket=${b.bucket}`} icon={b.icon} label={b.label}
              count={stats?.drivers[b.bucket]} active={onDrivers && bucket === b.bucket} onClick={close} />
          ))}
          <SideLink to="/admin/drivers/new" icon={UserPlus} label="Register a driver" active={location.pathname === '/admin/drivers/new'} onClick={close} />
        </div>
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Fleet owners</p>
          <SideLink to="/admin/fleet-owners" icon={Building2} label="All fleet owners" count={stats?.fleet.total}
            active={location.pathname.startsWith('/admin/fleet-owners') && !location.search.includes('pending')} onClick={close} />
          <SideLink to="/admin/fleet-owners?status=pending" icon={FileClock} label="Waiting approval" count={stats?.fleet.pending}
            active={location.pathname === '/admin/fleet-owners' && location.search.includes('pending')} onClick={close} />
        </div>
      </nav>

      <button onClick={logout} className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-red-300 hover:bg-white/5">
        <LogOut className="h-[18px] w-[18px]" /> Log out
      </button>
    </aside>
  );

  return (
    <div className="min-h-dvh bg-slate-100">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative h-full w-72 animate-slide-up">{sidebar}</div>
        </div>
      )}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="font-display font-bold text-brand-navy">RAJ<span className="text-brand-orange">WORTHMAN</span> <span className="font-sans text-[13px] font-medium text-slate-400">Admin</span></span>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
