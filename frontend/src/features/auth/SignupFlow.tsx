/* Sign-up, one screen per step:
   role → language → permissions → phone + OTP → name & date of birth → (drivers) work type + vehicles → home */
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Building2, Camera, Check, FolderOpen, Images, MapPin, MessageSquare, Phone, Truck, UserRound } from 'lucide-react';
import { AppShell, BottomAction, Btn, Chip, Field, OptionTile, ScreenTitle, StepProgress, TopBar } from '../../components/app/ui';
import { SteeringWheel } from '../../components/app/Brand';
import { useToast } from '../../components/ui/Toast';
import { PhoneOtp } from './PhoneOtp';
import { LanguageGrid } from './LanguageSheet';
import { useLangStore, useT, type TranslationKey } from '../../i18n';
import { PERM_KEYS, requestAllPermissions, type PermKey, type PermResult } from '../../lib/device';
import { authService, apiError } from '../../services/api';
import { homePathFor, useAuthStore, type Role, type Session } from '../../store/authStore';
import { VEHICLE_TYPES } from '../../config/vehicles';
import { cn } from '../../lib/utils';

type Draft = {
  role: Role | null;
  permissions: Partial<PermResult> | null;
  phone: string;
  signupToken: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  registrationType: 'DRIVER_ONLY' | 'DRIVER_WITH_VEHICLE';
  vehicleTypes: string[];
  set: (p: Partial<Omit<Draft, 'set' | 'reset'>>) => void;
  reset: () => void;
};

const EMPTY = {
  role: null, permissions: null, phone: '', signupToken: '', firstName: '', lastName: '', dateOfBirth: '',
  registrationType: 'DRIVER_ONLY' as const, vehicleTypes: [] as string[],
};

/* Kept for this browser tab only, so a reload mid-sign-up doesn't lose answers */
const useDraft = create<Draft>()(
  persist((set) => ({ ...EMPTY, set: (p) => set(p), reset: () => set(EMPTY) }), {
    name: 'rw-signup',
    storage: createJSONStorage(() => sessionStorage),
  }),
);

const STEPS = ['role', 'language', 'permissions', 'phone', 'details', 'work'] as const;
type Step = (typeof STEPS)[number];
const stepsFor = (role: Role | null): Step[] => (role === 'FLEET_OWNER' ? STEPS.filter((s) => s !== 'work') : [...STEPS]);

export const SignupFlow = () => {
  const { step = 'role' } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const draft = useDraft();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const steps = stepsFor(draft.role);
  const index = steps.indexOf(step as Step);

  if (isAuthenticated && user) return <Navigate to={homePathFor(user.role)} replace />;
  if (index < 0) return <Navigate to="/signup/role" replace />;
  // Don't allow jumping ahead of what has been answered
  if (index > 0 && !draft.role) return <Navigate to="/signup/role" replace />;
  if (index > steps.indexOf('phone') && !draft.signupToken) return <Navigate to="/signup/phone" replace />;

  const go = (s: Step) => navigate(`/signup/${s}`);
  const next = () => go(steps[index + 1]);

  return (
    <AppShell>
      <TopBar
        title={<span className="text-[14px] font-medium text-slate-500">{t('step_of', { n: index + 1, t: steps.length })}</span>}
        onBack={() => (index === 0 ? navigate('/login') : navigate(-1))}
      />
      <StepProgress step={index + 1} total={steps.length} />
      <div key={step} className="flex flex-1 animate-slide-up flex-col">
        {step === 'role' && <RoleStep onNext={next} />}
        {step === 'language' && <LanguageStep onNext={next} />}
        {step === 'permissions' && <PermissionsStep onNext={next} />}
        {step === 'phone' && <PhoneStep onNext={next} />}
        {step === 'details' && <DetailsStep onNext={next} />}
        {step === 'work' && <WorkStep />}
      </div>
    </AppShell>
  );
};

/* 1. Driver or fleet owner: two square boxes, Next underneath */
const RoleStep = ({ onNext }: { onNext: () => void }) => {
  const t = useT();
  const { role, set } = useDraft();
  return (
    <>
      <ScreenTitle title={t('role_title')} sub={t('role_sub')} />
      <div className="grid grid-cols-2 gap-3 px-5">
        <OptionTile
          className="aspect-square"
          selected={role === 'DRIVER'}
          onClick={() => set({ role: 'DRIVER' })}
          icon={<SteeringWheel className="h-11 w-11" rim={role === 'DRIVER' ? '#fff' : undefined} />}
          title={t('role_driver')}
          sub={t('role_driver_sub')}
        />
        <OptionTile
          className="aspect-square"
          selected={role === 'FLEET_OWNER'}
          onClick={() => set({ role: 'FLEET_OWNER' })}
          icon={<span className="relative"><Truck className="h-9 w-9" /><Building2 className="absolute -right-3 -top-3 h-5 w-5" /></span>}
          title={t('role_fleet')}
          sub={t('role_fleet_sub')}
        />
      </div>
      <div className="px-5 pt-6">
        <Btn onClick={onNext} disabled={!role}>{t('next')}</Btn>
      </div>
    </>
  );
};

/* 2. Language: the screen switches language as soon as one is tapped */
const LanguageStep = ({ onNext }: { onNext: () => void }) => {
  const t = useT();
  const { lang, setLang } = useLangStore();
  return (
    <>
      <ScreenTitle title={t('language_title')} sub={t('language_sub')} />
      <div className="px-5"><LanguageGrid value={lang} onPick={setLang} /></div>
      <BottomAction><Btn onClick={onNext}>{t('next')}</Btn></BottomAction>
    </>
  );
};

const PERM_INFO: Record<PermKey, { icon: typeof MapPin; title: TranslationKey; sub: TranslationKey }> = {
  location: { icon: MapPin, title: 'perm_location', sub: 'perm_location_sub' },
  camera: { icon: Camera, title: 'perm_camera', sub: 'perm_camera_sub' },
  files: { icon: FolderOpen, title: 'perm_files', sub: 'perm_files_sub' },
  gallery: { icon: Images, title: 'perm_gallery', sub: 'perm_gallery_sub' },
  phone: { icon: Phone, title: 'perm_phone', sub: 'perm_phone_sub' },
  sms: { icon: MessageSquare, title: 'perm_sms', sub: 'perm_sms_sub' },
};

/* 3. Location, camera, files, gallery, phone, messages */
const PermissionsStep = ({ onNext }: { onNext: () => void }) => {
  const t = useT();
  const { permissions, set } = useDraft();
  const [busy, setBusy] = useState(false);

  const allowAll = async () => {
    setBusy(true);
    try {
      const result = await requestAllPermissions();
      set({ permissions: result });
      onNext();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ScreenTitle title={t('perm_title')} sub={t('perm_sub')} />
      <div className="mx-5 divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-card">
        {PERM_KEYS.map((k) => {
          const { icon: Icon, title, sub } = PERM_INFO[k];
          const granted = permissions?.[k];
          return (
            <div key={k} className="flex items-center gap-3.5 px-4 py-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-orange/10 text-brand-orange"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-brand-navy">{t(title)}</span>
                <span className="block text-[13px] leading-snug text-slate-500">{t(sub)}</span>
              </span>
              {granted && <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white"><Check className="h-4 w-4" strokeWidth={3} /></span>}
            </div>
          );
        })}
      </div>
      <BottomAction className="space-y-2">
        <Btn onClick={allowAll} loading={busy}>{t('allow_all')}</Btn>
        <Btn variant="ghost" size="md" className="w-full" onClick={() => { set({ permissions: permissions ?? {} }); onNext(); }}>{t('not_now')}</Btn>
      </BottomAction>
    </>
  );
};

/* 4. Phone number, OTP opens below it */
const PhoneStep = ({ onNext }: { onNext: () => void }) => {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const draft = useDraft();
  const setSession = useAuthStore((s) => s.setSession);
  const setLang = useLangStore((s) => s.setLang);

  return (
    <>
      <ScreenTitle title={t('phone_title')} sub={t('phone_sub')} />
      <div className="px-5 pb-8">
        <PhoneOtp
          initialPhone={draft.phone}
          onVerified={(r) => {
            if (r.isNewUser) {
              draft.set({ phone: r.phone, signupToken: r.signupToken! });
              onNext();
              return;
            }
            // Number already has an account: just sign in
            const session = r.session as Session;
            setSession(session);
            if (session.user.language) setLang(session.user.language);
            draft.reset();
            toast.success(t('welcome_back_toast'));
            navigate(homePathFor(session.user.role), { replace: true });
          }}
        />
      </div>
    </>
  );
};

const maxDob = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
};

/* Creates the account; returns false on failure */
const useCreateAccount = () => {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const draft = useDraft();
  const lang = useLangStore((s) => s.lang);
  const setSession = useAuthStore((s) => s.setSession);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const res = await authService.signup({
        signupToken: draft.signupToken,
        role: draft.role,
        language: lang,
        permissions: draft.permissions,
        firstName: draft.firstName,
        lastName: draft.lastName,
        dateOfBirth: draft.dateOfBirth,
        registrationType: draft.registrationType,
        vehicleTypes: draft.vehicleTypes,
      });
      const session = res.data.data as Session;
      setSession(session);
      draft.reset();
      navigate(homePathFor(session.user.role), { replace: true });
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      toast.error(apiError(e, t('something_wrong')));
      if (status === 401) { draft.set({ signupToken: '' }); navigate('/signup/phone', { replace: true }); }
    } finally {
      setBusy(false);
    }
  };
  return { create, busy };
};

/* 5. First name, last name, date of birth */
const DetailsStep = ({ onNext }: { onNext: () => void }) => {
  const t = useT();
  const draft = useDraft();
  const { create, busy } = useCreateAccount();
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => ({
    firstName: draft.firstName.trim().length < 2 ? t('required') : '',
    lastName: draft.lastName.trim().length < 1 ? t('required') : '',
    dateOfBirth: !draft.dateOfBirth || draft.dateOfBirth > maxDob() ? t('dob_hint') : '',
  }), [draft.firstName, draft.lastName, draft.dateOfBirth, t]);
  const valid = !errors.firstName && !errors.lastName && !errors.dateOfBirth;

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    if (draft.role === 'FLEET_OWNER') void create();
    else onNext();
  };

  return (
    <>
      <ScreenTitle title={t('name_title')} sub={t('name_sub')} />
      <div className="space-y-4 px-5">
        <Field label={t('first_name')} autoComplete="given-name" value={draft.firstName} onChange={(e) => draft.set({ firstName: e.target.value })} error={touched ? errors.firstName : ''} autoFocus />
        <Field label={t('last_name')} autoComplete="family-name" value={draft.lastName} onChange={(e) => draft.set({ lastName: e.target.value })} error={touched ? errors.lastName : ''} />
        <Field label={t('dob')} type="date" max={maxDob()} min="1945-01-01" value={draft.dateOfBirth} onChange={(e) => draft.set({ dateOfBirth: e.target.value })} error={touched ? errors.dateOfBirth : ''} hint={t('dob_hint')} />
      </div>
      <BottomAction>
        <Btn onClick={submit} loading={busy}>{draft.role === 'FLEET_OWNER' ? t('create_account') : t('next')}</Btn>
      </BottomAction>
    </>
  );
};

/* 6. Drivers: driver only / driver with vehicle, and which vehicles they can drive */
const WorkStep = () => {
  const t = useT();
  const draft = useDraft();
  const { create, busy } = useCreateAccount();
  const toggle = (code: string) =>
    draft.set({ vehicleTypes: draft.vehicleTypes.includes(code) ? draft.vehicleTypes.filter((c) => c !== code) : [...draft.vehicleTypes, code] });

  return (
    <>
      <ScreenTitle title={t('type_title')} />
      <div className="grid grid-cols-2 gap-3 px-5">
        <OptionTile
          selected={draft.registrationType === 'DRIVER_ONLY'}
          onClick={() => draft.set({ registrationType: 'DRIVER_ONLY' })}
          icon={<UserRound className="h-8 w-8" />}
          title={t('driver_only')}
          sub={t('driver_only_sub')}
          className="py-5"
        />
        <OptionTile
          selected={draft.registrationType === 'DRIVER_WITH_VEHICLE'}
          onClick={() => draft.set({ registrationType: 'DRIVER_WITH_VEHICLE' })}
          icon={<Truck className="h-8 w-8" />}
          title={t('driver_vehicle')}
          sub={t('driver_vehicle_sub')}
          className="py-5"
        />
      </div>

      <div className="px-5 pb-2 pt-7">
        <h2 className="text-[18px] font-bold text-brand-navy">{t('fleet_title')}</h2>
        <p className="mt-0.5 text-[14px] text-slate-500">{t('fleet_sub')}</p>
      </div>
      <div className="flex flex-wrap gap-2.5 px-5">
        {VEHICLE_TYPES.map(({ code, icon: Icon, key }) => (
          <Chip key={code} selected={draft.vehicleTypes.includes(code)} onClick={() => toggle(code)} icon={<Icon className={cn('h-[18px] w-[18px]', draft.vehicleTypes.includes(code) ? 'text-white' : 'text-brand-orange')} />}>
            {t(key)}
          </Chip>
        ))}
      </div>

      <BottomAction>
        <Btn onClick={() => void create()} loading={busy} disabled={draft.vehicleTypes.length === 0}>{t('create_account')}</Btn>
      </BottomAction>
    </>
  );
};
