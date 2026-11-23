import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BadgeCheck, ChevronRight, Clock3, MapPin, Plus, Send, Trash2, Truck } from 'lucide-react';
import { Btn, Card, EmptyState, Sheet, Spinner, StatusPill } from '../../components/app/ui';
import { SteeringWheel } from '../../components/app/Brand';
import { useToast } from '../../components/ui/Toast';
import { useT, type TranslationKey } from '../../i18n';
import { fleetService, apiError, fileUrl } from '../../services/api';
import { shareLocationThrottled } from '../../lib/device';
import { useAuthStore } from '../../store/authStore';
import { vehicleKey } from '../../config/vehicles';
import { cn } from '../../lib/utils';

export type FleetVehicle = {
  id: string; vehicleType: string; registrationNumber: string; manufacturer: string; model: string;
  manufacturingYear?: number | null; capacity?: string | null; photos: string[]; rcUrl?: string | null; verificationStatus: string;
};
export type FleetOwner = {
  id: string; firstName: string; lastName: string; mobileNumber: string; companyName?: string | null; city?: string | null;
  verificationStatus: string; rejectionReason?: string | null; latitude?: number | null; longitude?: number | null; vehicles: FleetVehicle[];
};

export const useFleet = () =>
  useQuery<FleetOwner>({ queryKey: ['fleet-me'], queryFn: () => fleetService.getMe().then((r) => r.data.data), staleTime: 30_000 });

export const FleetHome = () => {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setProfile = useAuthStore((s) => s.setProfile);
  const { data: f, isLoading } = useFleet();
  const [removing, setRemoving] = useState<FleetVehicle | null>(null);

  useEffect(() => {
    shareLocationThrottled((lat, lng) => fleetService.updateLocation(lat, lng)).catch(() => {});
  }, []);

  const submit = useMutation({
    mutationFn: () => fleetService.submit(),
    onSuccess: (res) => {
      setProfile({ verificationStatus: res.data.data.verificationStatus });
      qc.invalidateQueries({ queryKey: ['fleet-me'] });
      toast.success(t('sent_title'), t('sent_sub'));
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => fleetService.deleteVehicle(id),
    onSuccess: () => { setRemoving(null); qc.invalidateQueries({ queryKey: ['fleet-me'] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading || !f) return <Spinner className="flex-1" />;
  const status = f.verificationStatus;
  const canSubmit = f.vehicles.length > 0 && (status === 'PROFILE_INCOMPLETE' || status === 'RESUBMISSION_REQUIRED' || status === 'REJECTED');

  return (
    <div className="pb-6">
      <header className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-brand-navy via-brand-deep to-brand-ink px-5 pb-16 text-white" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 18px)' }}>
        <SteeringWheel className="pointer-events-none absolute -right-10 -top-6 h-48 w-48 opacity-[0.07]" rim="#fff" />
        <p className="text-[14px] text-white/60">{t('hello')} 👋</p>
        <h1 className="truncate font-display text-[24px] font-bold">{f.firstName}</h1>
        <p className="mt-0.5 text-[13px] text-white/60">{f.companyName || t('fleet_hello_sub')}</p>
      </header>

      <div className="relative z-10 -mt-10 space-y-4 px-4">
        {/* Find drivers: the main action, like a ride-hailing home screen */}
        <button onClick={() => navigate('/fleet/drivers')} className="pressable relative flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-brand-orange to-brand-ember p-5 text-left text-white shadow-gold">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20"><MapPin className="h-7 w-7" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[18px] font-bold">{t('find_drivers')}</span>
            <span className="block text-[13.5px] text-white/85">{t('find_drivers_sub')}</span>
          </span>
          <ChevronRight className="h-6 w-6" />
        </button>

        <FleetStatus status={status} reason={f.rejectionReason} />

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <h2 className="text-[18px] font-bold text-brand-navy">{t('my_fleet')}</h2>
              <p className="text-[13px] text-slate-500">{t('vehicles_count', { n: f.vehicles.length })}</p>
            </div>
            <Btn size="md" variant="dark" onClick={() => navigate('/fleet/vehicles/new')}><Plus className="h-4 w-4" /> {t('add_vehicle')}</Btn>
          </div>

          {f.vehicles.length === 0 ? (
            <Card>
              <EmptyState icon={<Truck className="h-9 w-9" />} title={t('no_vehicles')} sub={t('no_vehicles_sub')}
                action={<Btn size="md" onClick={() => navigate('/fleet/vehicles/new')}><Plus className="h-4 w-4" /> {t('add_vehicle')}</Btn>} />
            </Card>
          ) : (
            <div className="space-y-3">
              {f.vehicles.map((v) => (
                <div key={v.id} className="overflow-hidden rounded-3xl bg-white shadow-card">
                  <div className="flex snap-x gap-1 overflow-x-auto no-scrollbar">
                    {v.photos.map((p) => (
                      <img key={p} src={fileUrl(p)} alt="" className="h-40 w-full shrink-0 snap-center object-cover" style={{ width: v.photos.length > 1 ? '85%' : '100%' }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-bold text-brand-navy">{v.registrationNumber}</p>
                      <p className="truncate text-[13px] text-slate-500">
                        {t(vehicleKey(v.vehicleType))} · {v.manufacturer} {v.model}{v.manufacturingYear ? ` · ${v.manufacturingYear}` : ''}{v.capacity ? ` · ${v.capacity}` : ''}
                      </p>
                    </div>
                    <StatusPill status={v.verificationStatus} label={t(`doc_status_${v.verificationStatus}` as TranslationKey)} />
                    <button aria-label={t('remove')} onClick={() => setRemoving(v)} className="pressable grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {canSubmit && <Btn onClick={() => submit.mutate()} loading={submit.isPending}><Send className="h-5 w-5" /> {t('fleet_send')}</Btn>}
      </div>

      <Sheet open={!!removing} onClose={() => setRemoving(null)} title={t('delete_confirm')}>
        <p className="mb-5 text-[15px] text-slate-600">{removing?.registrationNumber} · {removing?.manufacturer} {removing?.model}</p>
        <div className="grid grid-cols-2 gap-3">
          <Btn variant="outline" onClick={() => setRemoving(null)}>{t('cancel')}</Btn>
          <Btn variant="danger" loading={remove.isPending} onClick={() => removing && remove.mutate(removing.id)}>{t('remove')}</Btn>
        </div>
      </Sheet>
    </div>
  );
};

const FleetStatus = ({ status, reason }: { status: string; reason?: string | null }) => {
  const t = useT();
  if (status === 'PROFILE_INCOMPLETE') return null;
  const view = {
    SUBMITTED: { icon: Clock3, tone: 'bg-sky-50 text-sky-600', title: t('sent_title'), sub: t('sent_sub') },
    UNDER_REVIEW: { icon: Clock3, tone: 'bg-indigo-50 text-indigo-600', title: t('status_UNDER_REVIEW'), sub: t('sent_sub') },
    APPROVED: { icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-600', title: t('status_APPROVED'), sub: t('fleet_hello_sub') },
    RESUBMISSION_REQUIRED: { icon: AlertTriangle, tone: 'bg-red-50 text-red-600', title: t('status_RESUBMISSION_REQUIRED'), sub: reason ?? '' },
    REJECTED: { icon: AlertTriangle, tone: 'bg-red-50 text-red-600', title: t('status_REJECTED'), sub: reason ?? t('rejected_sub') },
  }[status];
  if (!view) return null;
  const Icon = view.icon;
  return (
    <Card className="flex items-center gap-4">
      <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', view.tone)}><Icon className="h-6 w-6" /></span>
      <div className="min-w-0">
        <p className="text-[16px] font-bold text-brand-navy">{view.title}</p>
        <p className="text-[13px] leading-snug text-slate-500">{view.sub}</p>
      </div>
    </Card>
  );
};
