import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, FileText, Globe, Headphones, LogOut, Phone, Truck } from 'lucide-react';
import { ListRow, StatusPill } from '../../components/app/ui';
import { SteeringWheel } from '../../components/app/Brand';
import { useToast } from '../../components/ui/Toast';
import { LanguageSheet } from '../auth/LanguageSheet';
import { LANGUAGES, useLangStore, useT, type TranslationKey } from '../../i18n';
import { authService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { APP_VERSION, CONTACT } from '../../config/site';
import { Avatar } from '../driver/DriverHome';

export const ProfilePage = () => {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, profile, logout } = useAuthStore();
  const lang = useLangStore((s) => s.lang);
  const [langOpen, setLangOpen] = useState(false);
  const isDriver = user?.role === 'DRIVER';
  const name = profile?.fullName ?? '';
  const phone = user?.phone ?? profile?.mobileNumber ?? '';

  const signOut = async () => {
    try { await authService.logout(); } catch { /* already signed out on the server */ }
    logout();
    qc.clear();
    navigate('/login', { replace: true });
  };

  return (
    <div className="pb-6">
      <header className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-brand-navy to-brand-ink px-5 pb-8 text-white" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
        <SteeringWheel className="pointer-events-none absolute -right-8 -top-4 h-40 w-40 opacity-[0.07]" rim="#fff" />
        <div className="flex items-center gap-4">
          <Avatar name={name} className="h-16 w-16 text-[24px]" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-[22px] font-bold">{name}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[14px] text-white/70"><Phone className="h-3.5 w-3.5" /> +91 {phone}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold">{isDriver ? t('driver_only') : t('fleet_owner_label')}</span>
              {profile?.verificationStatus && (
                <StatusPill status={profile.verificationStatus} label={t(`status_${profile.verificationStatus}` as TranslationKey)} />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mt-4 space-y-4 px-4">
        <section className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-card">
          <ListRow icon={<Globe className="h-5 w-5" />} title={t('language')} sub={LANGUAGES.find((l) => l.code === lang)?.native} onClick={() => setLangOpen(true)} />
          {isDriver ? (
            <>
              <ListRow icon={<FileText className="h-5 w-5" />} title={t('documents_title')} onClick={() => navigate('/driver/documents')} />
              <ListRow icon={<Bell className="h-5 w-5" />} title={t('notifications')} onClick={() => navigate('/driver/alerts')} />
            </>
          ) : (
            <ListRow icon={<Truck className="h-5 w-5" />} title={t('my_fleet')} onClick={() => navigate('/fleet')} />
          )}
          {CONTACT.phone && (
            <ListRow icon={<Headphones className="h-5 w-5" />} title={t('help')} sub={CONTACT.phone} onClick={() => { window.location.href = `tel:${CONTACT.phone}`; }} />
          )}
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-card">
          <ListRow icon={<LogOut className="h-5 w-5" />} tone="warn" title={<span className="text-red-600">{t('logout')}</span>} onClick={signOut} right={<span />} />
        </section>

        <p className="text-center text-[12px] text-slate-400">RajWorthman · {t('app_version')} {APP_VERSION}</p>
      </div>

      <LanguageSheet
        open={langOpen}
        onClose={() => setLangOpen(false)}
        onChanged={(code) => {
          authService.setLanguage(code).catch(() => toast.error(t('something_wrong')));
          useAuthStore.setState((s) => (s.user ? { user: { ...s.user, language: code } } : s));
        }}
      />
    </div>
  );
};
