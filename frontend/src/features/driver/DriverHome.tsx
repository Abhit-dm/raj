import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BadgeCheck, CheckCircle2, Clock3, FileText, HeartPulse, House, IdCard, MapPin, Route, Send, Truck, XCircle } from 'lucide-react';
import { Btn, Card, ListRow, Spinner } from '../../components/app/ui';
import { SteeringWheel } from '../../components/app/Brand';
import { useToast } from '../../components/ui/Toast';
import { useT } from '../../i18n';
import { driverService, apiError, fileUrl } from '../../services/api';
import { shareLocationThrottled } from '../../lib/device';
import { useAuthStore } from '../../store/authStore';
import { vehicleKey } from '../../config/vehicles';
import { cn } from '../../lib/utils';
import { driverTasks, useDriver, type TaskId } from './useDriver';

const TASK_ICON: Record<TaskId, typeof House> = {
  address: House, licence: IdCard, documents: FileText, vehicle: Truck, experience: Route, emergency: HeartPulse,
};

export const Avatar = ({ url, name, className }: { url?: string | null; name: string; className?: string }) => (
  url
    ? <img src={fileUrl(url)} alt="" className={cn('rounded-full object-cover ring-2 ring-white/70', className)} />
    : <span className={cn('grid place-items-center rounded-full bg-brand-orange font-bold text-white ring-2 ring-white/70', className)}>{name.trim().charAt(0).toUpperCase() || '?'}</span>
);

export const DriverHome = () => {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setProfile = useAuthStore((s) => s.setProfile);
  const { data: d, isLoading, isError, refetch } = useDriver();
  const [locationOk, setLocationOk] = useState<boolean | null>(null);

  // Share location in the background so fleet owners nearby can find this driver
  const shareLocation = () =>
    shareLocationThrottled((lat, lng) => driverService.updateLocation(lat, lng))
      .then(() => setLocationOk(true), () => setLocationOk(false));
  useEffect(() => { void shareLocation(); }, []);

  const availability = useMutation({
    mutationFn: (on: boolean) => driverService.setAvailability(on),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver-me'] }),
    onError: (e) => toast.error(apiError(e)),
  });

  const submit = useMutation({
    mutationFn: () => driverService.submit(),
    onSuccess: (res) => {
      setProfile({ verificationStatus: res.data.data.verificationStatus });
      qc.invalidateQueries({ queryKey: ['driver-me'] });
      toast.success(t('sent_title'), t('sent_sub'));
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading) return <Spinner className="flex-1" />;
  if (isError || !d) return <div className="p-6"><Btn onClick={() => refetch()}>{t('retry')}</Btn></div>;

  const tasks = driverTasks(d);
  const required = tasks.filter((x) => x.required);
  const doneCount = required.filter((x) => x.done).length;
  const allDone = doneCount === required.length;
  const status = d.verificationStatus;
  const canSubmit = allDone && (status === 'PROFILE_INCOMPLETE' || status === 'RESUBMISSION_REQUIRED');
  const firstName = d.firstName || d.fullName.split(' ')[0];
  const online = d.isAvailable;
  const toFix = d.documents.filter((x) => x.verificationStatus === 'RESUBMISSION_REQUIRED' || x.verificationStatus === 'REJECTED');

  const goTask = (id: TaskId) => navigate(id === 'documents' ? '/driver/documents' : `/driver/task/${id}`);

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-brand-navy via-brand-deep to-brand-ink px-5 pb-16 text-white" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 18px)' }}>
        <SteeringWheel className="pointer-events-none absolute -right-10 -top-6 h-48 w-48 opacity-[0.07]" rim="#fff" />
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-white/60">{t('hello')} 👋</p>
            <h1 className="truncate font-display text-[24px] font-bold">{firstName}</h1>
            <p className="mt-0.5 text-[12px] text-white/50">{t('registration_id')}: {d.registrationId}</p>
          </div>
          <button onClick={() => navigate('/driver/profile')} aria-label={t('nav_profile')}>
            <Avatar url={d.profilePhotoUrl} name={d.fullName} className="h-12 w-12 text-[18px]" />
          </button>
        </div>

        {/* Online / offline, like a captain app */}
        <button
          onClick={() => availability.mutate(!online)}
          disabled={availability.isPending}
          className={cn('pressable mt-5 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors', online ? 'bg-emerald-500/15 ring-1 ring-emerald-400/40' : 'bg-white/10 ring-1 ring-white/15')}
        >
          <span className={cn('relative h-8 w-14 shrink-0 rounded-full transition-colors', online ? 'bg-emerald-500' : 'bg-white/25')}>
            <span className={cn('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all', online ? 'left-7' : 'left-1')} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold">{online ? t('online') : t('offline')}</span>
            <span className="block truncate text-[12.5px] text-white/60">{online ? t('online_sub') : t('offline_sub')}</span>
          </span>
          {online && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />}
        </button>
      </header>

      <div className="relative z-10 -mt-10 space-y-4 px-4">
        <StatusCard status={status} doneCount={doneCount} total={required.length} />

        {locationOk === false && (
          <Card className="flex items-center gap-3 bg-amber-50 shadow-none ring-1 ring-amber-200">
            <MapPin className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="flex-1 text-[13.5px] text-amber-900">{t('location_off')}</p>
            <Btn size="sm" variant="dark" onClick={() => { sessionStorage.removeItem('rw-loc-sent'); void shareLocation(); }}>{t('turn_on')}</Btn>
          </Card>
        )}

        {toFix.length > 0 && (
          <Card className="ring-1 ring-red-200">
            <p className="mb-2 flex items-center gap-2 text-[15px] font-bold text-red-600"><AlertTriangle className="h-5 w-5" /> {t('fix_title')}</p>
            <ul className="space-y-1.5">
              {toFix.map((doc) => (
                <li key={doc.id} className="text-[13.5px] text-slate-700">
                  <b>{t(`doc_${doc.documentType}` as never)}</b>{doc.rejectionReason ? `: ${doc.rejectionReason}` : ''}
                </li>
              ))}
            </ul>
            <Btn size="md" variant="dark" className="mt-3 w-full" onClick={() => navigate('/driver/documents')}>{t('reupload')}</Btn>
          </Card>
        )}

        {status !== 'APPROVED' && (
          <section className="overflow-hidden rounded-3xl bg-white shadow-card">
            <div className="flex items-center justify-between px-4 pb-1 pt-4">
              <h2 className="text-[17px] font-bold text-brand-navy">{t('finish_profile')}</h2>
              <span className="text-[13px] font-semibold text-slate-500">{t('steps_done', { n: doneCount, t: required.length })}</span>
            </div>
            <div className="mx-4 mb-1 mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-ember transition-all" style={{ width: `${(doneCount / required.length) * 100}%` }} />
            </div>
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const Icon = TASK_ICON[task.id];
                return (
                  <ListRow
                    key={task.id}
                    icon={<Icon className="h-5 w-5" />}
                    tone={task.warn ? 'warn' : task.done ? 'done' : 'default'}
                    title={t(task.label)}
                    sub={!task.required ? t('optional') : task.progress ? `${task.progress[0]} / ${task.progress[1]}` : undefined}
                    onClick={() => goTask(task.id)}
                    right={task.done && !task.warn ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : undefined}
                  />
                );
              })}
            </div>
          </section>
        )}

        {canSubmit && (
          <Btn onClick={() => submit.mutate()} loading={submit.isPending}><Send className="h-5 w-5" /> {t('send_for_verification')}</Btn>
        )}

        {d.vehicleTypes.length > 0 && (
          <Card>
            <p className="mb-2.5 text-[13px] font-semibold text-slate-500">{t('fleet_title')}</p>
            <div className="flex flex-wrap gap-2">
              {d.vehicleTypes.map((v) => (
                <span key={v} className="rounded-full bg-brand-navy/5 px-3 py-1.5 text-[13px] font-semibold text-brand-navy">{t(vehicleKey(v))}</span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

const StatusCard = ({ status, doneCount, total }: { status: string; doneCount: number; total: number }) => {
  const t = useT();
  const view = {
    PROFILE_INCOMPLETE: doneCount === total
      ? { icon: Send, tone: 'text-brand-orange bg-brand-orange/10', title: t('send_for_verification'), sub: t('steps_done', { n: doneCount, t: total }) }
      : { icon: Clock3, tone: 'text-amber-600 bg-amber-50', title: t('status_PROFILE_INCOMPLETE'), sub: t('steps_done', { n: doneCount, t: total }) },
    SUBMITTED: { icon: Clock3, tone: 'text-sky-600 bg-sky-50', title: t('sent_title'), sub: t('sent_sub') },
    UNDER_REVIEW: { icon: Clock3, tone: 'text-indigo-600 bg-indigo-50', title: t('status_UNDER_REVIEW'), sub: t('sent_sub') },
    APPROVED: { icon: BadgeCheck, tone: 'text-emerald-600 bg-emerald-50', title: t('approved_title'), sub: t('approved_sub') },
    RESUBMISSION_REQUIRED: { icon: AlertTriangle, tone: 'text-red-600 bg-red-50', title: t('status_RESUBMISSION_REQUIRED'), sub: t('fix_sub') },
    REJECTED: { icon: XCircle, tone: 'text-red-600 bg-red-50', title: t('status_REJECTED'), sub: t('rejected_sub') },
  }[status] ?? { icon: Clock3, tone: 'text-slate-600 bg-slate-50', title: status, sub: '' };
  const Icon = view.icon;
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={cn('grid h-14 w-14 shrink-0 place-items-center rounded-2xl', view.tone)}><Icon className="h-7 w-7" /></span>
      <div className="min-w-0">
        <p className="text-[17px] font-bold text-brand-navy">{view.title}</p>
        <p className="mt-0.5 text-[13.5px] leading-snug text-slate-500">{view.sub}</p>
      </div>
    </Card>
  );
};
