import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { BadgeCheck, Bell, FileWarning, Info } from 'lucide-react';
import { EmptyState, ScreenTitle, Spinner } from '../../components/app/ui';
import { useT } from '../../i18n';
import { notificationService } from '../../services/api';
import { cn } from '../../lib/utils';

type Notice = { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string };

const ICONS: Record<string, { icon: typeof Bell; tone: string }> = {
  APPROVAL: { icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-600' },
  REJECTION: { icon: FileWarning, tone: 'bg-red-50 text-red-500' },
  DOCUMENT: { icon: FileWarning, tone: 'bg-amber-50 text-amber-600' },
};

export const DriverAlerts = () => {
  const t = useT();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<Notice[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll().then((r) => r.data.data),
  });

  // Opening the screen marks everything as read
  useEffect(() => {
    if (data.some((n) => !n.isRead)) {
      notificationService.markAllRead().then(() => qc.invalidateQueries({ queryKey: ['notifications'] })).catch(() => {});
    }
  }, [data, qc]);

  return (
    <div className="pb-6" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <ScreenTitle title={t('notifications')} />
      {isLoading ? <Spinner /> : data.length === 0 ? (
        <EmptyState icon={<Bell className="h-9 w-9" />} title={t('no_notifications')} />
      ) : (
        <div className="space-y-2.5 px-4">
          {data.map((n) => {
            const { icon: Icon, tone } = ICONS[n.type] ?? { icon: Info, tone: 'bg-sky-50 text-sky-600' };
            return (
              <div key={n.id} className={cn('flex gap-3.5 rounded-3xl bg-white p-4 shadow-card', !n.isRead && 'ring-2 ring-brand-orange/30')}>
                <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', tone)}><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-brand-navy">{n.title}</p>
                  <p className="mt-0.5 text-[13.5px] leading-snug text-slate-600">{n.message}</p>
                  <p className="mt-1.5 text-[12px] text-slate-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
