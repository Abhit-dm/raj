/* Mobile-first UI kit for the driver and fleet owner apps. */
import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/* Phone-width app column. On a computer it sits centred like a phone screen. */
export const AppShell = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className="min-h-dvh bg-brand-ink/95 sm:bg-[radial-gradient(circle_at_top,#13284D,#050E1F)] sm:py-6">
    <div className={cn('relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-[#F3F5F9] sm:min-h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[28px] sm:shadow-2xl', className)}>
      {children}
    </div>
  </div>
);

type TopBarProps = { title?: ReactNode; onBack?: () => void; back?: boolean; right?: ReactNode; dark?: boolean; className?: string };

export const TopBar = ({ title, onBack, back = true, right, dark, className }: TopBarProps) => {
  const navigate = useNavigate();
  return (
    <header
      className={cn('sticky top-0 z-30 flex h-14 items-center gap-2 px-2', dark ? 'bg-brand-navy text-white' : 'bg-[#F3F5F9]/90 text-brand-navy backdrop-blur', className)}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {back ? (
        <button aria-label="Back" onClick={onBack ?? (() => navigate(-1))} className={cn('pressable grid h-10 w-10 place-items-center rounded-full', dark ? 'hover:bg-white/10' : 'hover:bg-black/5')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : <span className="w-2" />}
      <div className="min-w-0 flex-1 truncate text-[17px] font-semibold">{title}</div>
      {right}
    </header>
  );
};

/* Segmented progress for multi-step flows */
export const StepProgress = ({ step, total }: { step: number; total: number }) => (
  <div className="flex gap-1.5 px-5">
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div className={cn('h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-ember transition-all duration-500', i < step ? 'w-full' : 'w-0')} />
      </div>
    ))}
  </div>
);

export const ScreenTitle = ({ title, sub, className }: { title: ReactNode; sub?: ReactNode; className?: string }) => (
  <div className={cn('px-5 pb-4 pt-5', className)}>
    <h1 className="font-display text-[26px] font-bold leading-tight text-brand-navy">{title}</h1>
    {sub && <p className="mt-1.5 text-[15px] leading-snug text-slate-500">{sub}</p>}
  </div>
);

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: 'primary' | 'dark' | 'ghost' | 'outline' | 'danger'; size?: 'lg' | 'md' | 'sm' };

export const Btn = forwardRef<HTMLButtonElement, BtnProps>(({ className, loading, disabled, variant = 'primary', size = 'lg', children, ...rest }, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={cn(
      'pressable inline-flex select-none items-center justify-center gap-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
      size === 'lg' && 'h-14 w-full rounded-2xl text-[16px]',
      size === 'md' && 'h-11 rounded-xl px-5 text-[15px]',
      size === 'sm' && 'h-9 rounded-lg px-3.5 text-[13px]',
      variant === 'primary' && 'bg-gradient-to-r from-brand-orange to-brand-ember text-white shadow-gold',
      variant === 'dark' && 'bg-brand-navy text-white shadow-card',
      variant === 'ghost' && 'bg-transparent text-brand-navy hover:bg-black/5',
      variant === 'outline' && 'border-2 border-brand-navy/15 bg-white text-brand-navy',
      variant === 'danger' && 'bg-red-50 text-red-600',
      className,
    )}
    {...rest}
  >
    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
    {children}
  </button>
));
Btn.displayName = 'Btn';

/* Button area pinned to the bottom of the screen, above the home indicator */
export const BottomAction = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('sticky bottom-0 z-20 mt-auto bg-gradient-to-t from-[#F3F5F9] via-[#F3F5F9] to-[#F3F5F9]/0 px-5 pb-5 pt-6 safe-bottom', className)}>
    {children}
  </div>
);

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & { label: string; error?: string; lead?: ReactNode; hint?: string };

export const Field = forwardRef<HTMLInputElement, FieldProps>(({ label, error, lead, hint, className, id, ...rest }, ref) => {
  const inputId = id ?? `f-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-semibold text-slate-600">{label}</label>
      <div className={cn('flex h-14 items-center rounded-2xl border-2 bg-white px-4 transition-colors focus-within:border-brand-orange', error ? 'border-red-400' : 'border-slate-200')}>
        {lead && <span className="mr-3 flex items-center text-[16px] font-semibold text-brand-navy">{lead}</span>}
        <input ref={ref} id={inputId} className="h-full w-full min-w-0 bg-transparent text-[16px] font-medium text-brand-navy outline-none placeholder:font-normal placeholder:text-slate-400" {...rest} />
      </div>
      {error ? <p className="mt-1.5 text-[13px] text-red-500">{error}</p> : hint ? <p className="mt-1.5 text-[13px] text-slate-400">{hint}</p> : null}
    </div>
  );
});
Field.displayName = 'Field';

export const SelectField = ({ label, value, onChange, options, error, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[] | { value: string; label: string }[]; error?: string; placeholder?: string;
}) => (
  <div>
    <label className="mb-1.5 block text-[13px] font-semibold text-slate-600">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('h-14 w-full appearance-none rounded-2xl border-2 bg-white bg-[length:18px] bg-[right_16px_center] bg-no-repeat px-4 text-[16px] font-medium text-brand-navy outline-none focus:border-brand-orange', error ? 'border-red-400' : 'border-slate-200')}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
    >
      <option value="">{placeholder ?? 'Select'}</option>
      {options.map((o) => typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="mt-1.5 text-[13px] text-red-500">{error}</p>}
  </div>
);

/* Big selectable tile (role, work type) */
export const OptionTile = ({ selected, onClick, icon, title, sub, className }: {
  selected: boolean; onClick: () => void; icon: ReactNode; title: string; sub?: string; className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      'pressable relative flex flex-col items-center justify-center gap-3 rounded-3xl border-2 bg-white p-4 text-center shadow-card transition-colors',
      selected ? 'border-brand-orange bg-brand-sand' : 'border-transparent',
      className,
    )}
  >
    <span className={cn('absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border-2 transition-colors', selected ? 'border-brand-orange bg-brand-orange text-white' : 'border-slate-300')}>
      {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
    <span className={cn('grid h-16 w-16 place-items-center rounded-2xl transition-colors', selected ? 'bg-brand-orange text-white' : 'bg-brand-navy/5 text-brand-navy')}>{icon}</span>
    <span>
      <span className="block text-[15px] font-bold leading-tight text-brand-navy">{title}</span>
      {sub && <span className="mt-1 block text-[12.5px] leading-snug text-slate-500">{sub}</span>}
    </span>
  </button>
);

export const Chip = ({ selected, onClick, children, icon }: { selected: boolean; onClick: () => void; children: ReactNode; icon?: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      'pressable inline-flex h-11 shrink-0 items-center gap-2 rounded-full border-2 px-4 text-[14px] font-semibold transition-colors',
      selected ? 'border-brand-orange bg-brand-orange text-white' : 'border-slate-200 bg-white text-brand-navy',
    )}
  >
    {icon}
    {children}
    {selected && <Check className="h-4 w-4" strokeWidth={3} />}
  </button>
);

export const Card = ({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={cn('block w-full rounded-3xl bg-white p-4 text-left shadow-card', onClick && 'pressable', className)}>
      {children}
    </Tag>
  );
};

/* List row used on home and profile screens */
export const ListRow = ({ icon, title, sub, right, onClick, tone = 'default' }: {
  icon: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; tone?: 'default' | 'done' | 'warn';
}) => (
  <button type="button" onClick={onClick} className="pressable flex w-full items-center gap-3.5 px-4 py-3.5 text-left">
    <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
      tone === 'done' ? 'bg-emerald-50 text-emerald-600' : tone === 'warn' ? 'bg-red-50 text-red-500' : 'bg-brand-orange/10 text-brand-orange')}>
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[15px] font-semibold text-brand-navy">{title}</span>
      {sub && <span className="mt-0.5 block truncate text-[13px] text-slate-500">{sub}</span>}
    </span>
    {right ?? <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />}
  </button>
);

const STATUS_TONE: Record<string, string> = {
  PROFILE_INCOMPLETE: 'bg-amber-100 text-amber-800',
  SUBMITTED: 'bg-sky-100 text-sky-800',
  UNDER_REVIEW: 'bg-indigo-100 text-indigo-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  VERIFIED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
  RESUBMISSION_REQUIRED: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-800',
  EXPIRED: 'bg-slate-200 text-slate-700',
};

export const StatusPill = ({ status, label, className }: { status: string; label: string; className?: string }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold', STATUS_TONE[status] ?? 'bg-slate-100 text-slate-700', className)}>{label}</span>
);

/* Bottom sheet modal */
export const Sheet = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 animate-fade-in bg-brand-ink/60" onClick={onClose} />
      <div className="relative w-full max-w-[480px] animate-sheet-up rounded-t-[28px] bg-white px-5 pb-6 pt-3 shadow-sheet safe-bottom">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        {title && (
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-brand-navy">{title}</h2>
            <button aria-label="Close" onClick={onClose} className="pressable grid h-9 w-9 place-items-center rounded-full bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export const Spinner = ({ className }: { className?: string }) => (
  <div className={cn('grid place-items-center py-16', className)}><Loader2 className="h-8 w-8 animate-spin text-brand-orange" /></div>
);

export const EmptyState = ({ icon, title, sub, action }: { icon: ReactNode; title: string; sub?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center px-8 py-12 text-center">
    <div className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-brand-orange/10 text-brand-orange">{icon}</div>
    <p className="text-[17px] font-bold text-brand-navy">{title}</p>
    {sub && <p className="mt-1 text-[14px] text-slate-500">{sub}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
