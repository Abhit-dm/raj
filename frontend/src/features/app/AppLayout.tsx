import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, FileText, House, UserRound, Users } from 'lucide-react';
import { AppShell } from '../../components/app/ui';
import { homePathFor, useAuthStore, type Role } from '../../store/authStore';
import { useLangStore, useT, type TranslationKey } from '../../i18n';
import { authService } from '../../services/api';
import { cn } from '../../lib/utils';

const NAV: Record<Role, { to: string; icon: typeof House; label: TranslationKey; end?: boolean }[]> = {
  DRIVER: [
    { to: '/driver', icon: House, label: 'nav_home', end: true },
    { to: '/driver/documents', icon: FileText, label: 'nav_documents' },
    { to: '/driver/alerts', icon: Bell, label: 'nav_alerts' },
    { to: '/driver/profile', icon: UserRound, label: 'nav_profile' },
  ],
  FLEET_OWNER: [
    { to: '/fleet', icon: House, label: 'nav_home', end: true },
    { to: '/fleet/drivers', icon: Users, label: 'nav_find_drivers' },
    { to: '/fleet/profile', icon: UserRound, label: 'nav_profile' },
  ],
};

export const BottomNav = ({ role }: { role: Role }) => {
  const t = useT();
  return (
    <nav className="sticky bottom-0 z-30 mt-auto border-t border-slate-100 bg-white/95 backdrop-blur safe-bottom">
      <div className="flex">
        {NAV[role].map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className="pressable flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5">
            {({ isActive }) => (
              <>
                <span className={cn('grid h-8 w-14 place-items-center rounded-full transition-colors', isActive ? 'bg-brand-orange/10 text-brand-orange' : 'text-slate-400')}>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span className={cn('text-[11.5px] font-semibold', isActive ? 'text-brand-orange' : 'text-slate-500')}>{t(label)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

/* Signed-in area for one role. Pages without the tab bar (forms, map) set hideNav via route handle. */
export const AppLayout = ({ role }: { role: Role }) => {
  const { isAuthenticated, user } = useAuthStore();
  const setLang = useLangStore((s) => s.setLang);
  const location = useLocation();

  // Refresh the session's user (language, status) once per app start
  useEffect(() => {
    if (!isAuthenticated) return;
    authService.me().then((res) => {
      const { user: u, profile } = res.data.data;
      useAuthStore.setState({ user: u, profile });
      if (u.language) setLang(u.language);
    }).catch(() => { /* the API interceptor handles expired sessions */ });
  }, [isAuthenticated, setLang]);

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homePathFor(user.role)} replace />;

  const tabRoots = NAV[role].map((n) => n.to);
  const showNav = tabRoots.includes(location.pathname.replace(/\/$/, ''));

  return (
    <AppShell>
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      {showNav && <BottomNav role={role} />}
    </AppShell>
  );
};
