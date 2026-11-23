import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { AppShell } from '../../components/app/ui';
import { HighwayHero } from '../../components/app/Brand';
import { useToast } from '../../components/ui/Toast';
import { PhoneOtp } from './PhoneOtp';
import { LanguageSheet } from './LanguageSheet';
import { LANGUAGES, useLangStore, useT } from '../../i18n';
import { homePathFor, useAuthStore, type Session } from '../../store/authStore';
import emblem from '../../assets/brand/logo-emblem.png';

export const BrandHeader = ({ compact = false }: { compact?: boolean }) => {
  const t = useT();
  return (
    <div className="flex flex-col items-center text-center">
      <img src={emblem} alt="" className={compact ? 'h-14 w-auto drop-shadow-xl' : 'h-20 w-auto drop-shadow-xl'} />
      <div className={`mt-3 font-display font-extrabold tracking-wide ${compact ? 'text-[22px]' : 'text-[28px]'}`}>
        <span className="text-white">RAJ</span><span className="text-brand-orange">WORTHMAN</span>
      </div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-orange-200/90">{t('tagline')}</div>
    </div>
  );
};

export const LanguageChip = ({ onClick }: { onClick: () => void }) => {
  const lang = useLangStore((s) => s.lang);
  const label = LANGUAGES.find((l) => l.code === lang)?.native ?? 'English';
  return (
    <button onClick={onClick} className="pressable flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-[13px] font-semibold text-white backdrop-blur">
      <Globe className="h-4 w-4" /> {label}
    </button>
  );
};

export const LoginPage = () => {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, user, setSession } = useAuthStore();
  const setLang = useLangStore((s) => s.setLang);
  const [langOpen, setLangOpen] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);

  if (isAuthenticated && user) return <Navigate to={homePathFor(user.role)} replace />;

  return (
    <AppShell className="bg-white">
      <HighwayHero className="h-[48dvh] min-h-[360px]">
        <div className="flex justify-end px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
          <LanguageChip onClick={() => setLangOpen(true)} />
        </div>
        <div className="mt-2 px-6"><BrandHeader /></div>
      </HighwayHero>

      <main className="relative -mt-8 flex flex-1 flex-col rounded-t-[32px] bg-white px-5 pb-8 pt-7 safe-bottom">
        <h1 className="font-display text-[26px] font-bold text-brand-navy">{t('login_title')}</h1>
        <p className="mb-6 mt-1 text-[15px] text-slate-500">{t('login_sub')}</p>

        <PhoneOtp
          requireRegistered
          onNotRegistered={() => setNotRegistered(true)}
          onVerified={(r) => {
            if (r.isNewUser) { setNotRegistered(true); return; }
            const session = r.session as Session;
            setSession(session);
            if (session.user.language) setLang(session.user.language);
            toast.success(t('welcome_back_toast'));
            navigate(homePathFor(session.user.role), { replace: true });
          }}
        />

        <div className={`mt-8 rounded-2xl p-4 text-center ${notRegistered ? 'bg-brand-sand ring-2 ring-brand-orange/40' : 'bg-slate-50'}`}>
          <span className="text-[15px] text-slate-600">{t('no_account')} </span>
          <Link to="/signup" className="text-[15px] font-bold text-brand-orange">{t('sign_up')}</Link>
        </div>
      </main>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </AppShell>
  );
};
