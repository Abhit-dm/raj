import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Eye, EyeOff, FileText, Search, ShieldCheck, Truck, UserPlus } from 'lucide-react';
import { adminService, type DriverBucket } from '../../services/adminApi';
import { apiError, fileUrl } from '../../services/api';
import { HighwayHero, SteeringWheel } from '../../components/app/Brand';
import { useToast } from '../../components/ui/Toast';
import { VEHICLE_TYPES } from '../../config/vehicles';
import { translate } from '../../i18n';
import { cn } from '../../lib/utils';
import { DRIVER_BUCKETS, useAdminStats } from './AdminLayout';

export const STATUS_LABEL: Record<string, string> = {
  PROFILE_INCOMPLETE: 'Profile incomplete', SUBMITTED: 'Waiting review', UNDER_REVIEW: 'Under review', APPROVED: 'Approved',
  REJECTED: 'Rejected', RESUBMISSION_REQUIRED: 'Re-upload asked', PENDING: 'Pending', VERIFIED: 'Verified', EXPIRED: 'Expired',
};
const STATUS_TONE: Record<string, string> = {
  PROFILE_INCOMPLETE: 'bg-amber-100 text-amber-800', SUBMITTED: 'bg-sky-100 text-sky-800', UNDER_REVIEW: 'bg-indigo-100 text-indigo-800',
  APPROVED: 'bg-emerald-100 text-emerald-800', VERIFIED: 'bg-emerald-100 text-emerald-800', REJECTED: 'bg-red-100 text-red-700',
  RESUBMISSION_REQUIRED: 'bg-orange-100 text-orange-800', PENDING: 'bg-amber-100 text-amber-800',
};
export const AdminStatus = ({ status }: { status: string }) => (
  <span className={cn('inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold', STATUS_TONE[status] ?? 'bg-slate-100 text-slate-700')}>{STATUS_LABEL[status] ?? status}</span>
);
export const vehicleLabel = (code: string) => translate('en', VEHICLE_TYPES.find((v) => v.code === code)?.key ?? 'v_CAR');

export const adminInput = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-brand-navy outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10';
export const adminBtn = 'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-semibold transition disabled:opacity-50';

/* ── Login ── */
export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const res = await adminService.login(email, password);
      localStorage.setItem('adminToken', res.data.data.accessToken);
      navigate('/admin/drivers?bucket=completed');
    } catch (err) {
      setError((err as { response?: { status?: number } })?.response?.status === 401 ? 'Invalid email or password' : apiError(err));
    } finally { setBusy(false); }
  };

  return (
    <HighwayHero className="grid min-h-dvh place-items-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-[400px] rounded-[28px] bg-white p-8 text-brand-navy shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <SteeringWheel className="h-14 w-14" />
          <h1 className="mt-3 font-display text-[22px] font-bold">RAJ<span className="text-brand-orange">WORTHMAN</span> Admin</h1>
          <p className="text-[13px] text-slate-500">Driver and fleet verification</p>
        </div>
        {error && <p className="mb-4 rounded-xl bg-red-50 px-3 py-2.5 text-center text-[13px] text-red-600">{error}</p>}
        <label className="mb-1 block text-[12px] font-semibold text-slate-500">Email</label>
        <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={adminInput} />
        <label className="mb-1 mt-4 block text-[12px] font-semibold text-slate-500">Password</label>
        <div className="relative">
          <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={cn(adminInput, 'pr-11')} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Show password">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button disabled={busy} className={cn(adminBtn, 'mt-6 w-full bg-gradient-to-r from-brand-orange to-brand-ember text-white shadow-gold')}>
          <ShieldCheck className="h-4 w-4" /> {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </HighwayHero>
  );
};

type DriverRow = {
  id: string; fullName: string; mobileNumber: string; registrationId: string; verificationStatus: string; registrationType: string;
  profilePhotoUrl?: string | null; createdAt: string; vehicleTypes: string[]; createdByAdmin: boolean;
  documents: { documentType: string; verificationStatus: string }[]; vehicles: { id: string }[]; address?: { district: string; state: string } | null;
};

/* ── Drivers list (one sidebar bucket at a time) ── */
export const AdminDriversPage = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const bucket = (params.get('bucket') ?? 'all') as DriverBucket;
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data: stats } = useAdminStats();

  useEffect(() => { const id = setTimeout(() => { setQuery(search); setPage(1); }, 300); return () => clearTimeout(id); }, [search]);
  useEffect(() => { setPage(1); }, [bucket]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-drivers', bucket, query, page],
    queryFn: () => adminService.getDrivers({ bucket, search: query || undefined, page }).then((r) => r.data.data as { drivers: DriverRow[]; total: number; pages: number }),
  });
  const title = DRIVER_BUCKETS.find((b) => b.bucket === bucket)?.label ?? 'Drivers';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-bold text-brand-navy">{title}</h1>
          <p className="text-[14px] text-slate-500">{data?.total ?? '…'} driver{data?.total === 1 ? '' : 's'}</p>
        </div>
        <Link to="/admin/drivers/new" className={cn(adminBtn, 'bg-brand-navy text-white')}><UserPlus className="h-4 w-4" /> Register a driver</Link>
      </div>

      {/* Summary tiles double as filters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {DRIVER_BUCKETS.map(({ bucket: b, label, icon: Icon }) => (
          <button key={b} onClick={() => setParams({ bucket: b })}
            className={cn('rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 transition', bucket === b ? 'ring-2 ring-brand-orange' : 'ring-slate-200 hover:ring-slate-300')}>
            <Icon className={cn('h-5 w-5', bucket === b ? 'text-brand-orange' : 'text-slate-400')} />
            <p className="mt-2 text-[24px] font-bold leading-none text-brand-navy">{stats?.drivers[b] ?? '–'}</p>
            <p className="mt-1 text-[12px] leading-tight text-slate-500">{label}</p>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, mobile number or ID" className={cn(adminInput, 'pl-10')} />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {isLoading ? <p className="p-10 text-center text-slate-400">Loading…</p> : !data?.drivers.length ? (
          <p className="p-10 text-center text-slate-400">No drivers here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[14px]">
              <thead className="bg-slate-50 text-[12px] uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Driver</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Documents</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Registered</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.drivers.map((d) => {
                  const rc = d.documents.find((x) => x.documentType === 'RC_BOOK');
                  return (
                    <tr key={d.id} onClick={() => navigate(`/admin/drivers/${d.id}`)} className="cursor-pointer hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {d.profilePhotoUrl
                            ? <img src={fileUrl(d.profilePhotoUrl)} alt="" className="h-10 w-10 rounded-full object-cover" />
                            : <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-navy font-bold text-white">{d.fullName.charAt(0)}</span>}
                          <div className="min-w-0">
                            <p className="font-semibold text-brand-navy">{d.fullName} {d.createdByAdmin && <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">ADDED BY ADMIN</span>}</p>
                            <p className="text-[12.5px] text-slate-500">+91 {d.mobileNumber} · {d.registrationId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[13px] font-medium text-brand-navy">{d.registrationType === 'DRIVER_WITH_VEHICLE' && <Truck className="h-3.5 w-3.5 text-brand-orange" />}{d.registrationType === 'DRIVER_WITH_VEHICLE' ? 'With vehicle' : 'Driver only'}</p>
                        <p className="max-w-[180px] truncate text-[12px] text-slate-500">{d.vehicleTypes.map(vehicleLabel).join(', ')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[13px] text-slate-600"><FileText className="h-3.5 w-3.5" /> {d.documents.length} uploaded</p>
                        {rc && <p className="mt-0.5 text-[12px]">RC: <AdminStatus status={rc.verificationStatus} /></p>}
                      </td>
                      <td className="px-4 py-3"><AdminStatus status={d.verificationStatus} /></td>
                      <td className="px-4 py-3 text-[13px] text-slate-500">{format(new Date(d.createdAt), 'd MMM yyyy')}</td>
                      <td className="px-4 py-3 text-right"><ChevronRight className="inline h-4 w-4 text-slate-300" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={cn(adminBtn, 'bg-white ring-1 ring-slate-200')}><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-[14px] text-slate-500">Page {page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className={cn(adminBtn, 'bg-white ring-1 ring-slate-200')}><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
};

/* ── Admin registers a driver directly ── */
export const AdminAddDriverPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [f, setF] = useState({ firstName: '', lastName: '', phone: '', dateOfBirth: '', registrationType: 'DRIVER_ONLY', vehicleTypes: [] as string[] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(f.phone)) { setError('Enter a valid 10-digit mobile number'); return; }
    if (f.vehicleTypes.length === 0) { setError('Select at least one vehicle type'); return; }
    setBusy(true);
    try {
      const res = await adminService.createDriver(f);
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['admin-drivers'] });
      toast.success('Driver registered', `${f.firstName} can now log in with +91 ${f.phone}`);
      navigate(`/admin/drivers/${res.data.data.id}`);
    } catch (err) {
      setError(apiError(err));
    } finally { setBusy(false); }
  };
  const toggle = (code: string) => setF((s) => ({ ...s, vehicleTypes: s.vehicleTypes.includes(code) ? s.vehicleTypes.filter((c) => c !== code) : [...s.vehicleTypes, code] }));
  const maxDob = new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10);

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-[24px] font-bold text-brand-navy">Register a driver</h1>
        <p className="text-[14px] text-slate-500">The driver logs in to the app with this mobile number (OTP) and completes the remaining steps there.</p>
      </div>
      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-slate-500">First name</span>
            <input required minLength={2} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} className={adminInput} /></label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-slate-500">Last name</span>
            <input required value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} className={adminInput} /></label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-slate-500">Mobile number</span>
            <div className="flex"><span className="grid place-items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-[14px] text-slate-500">+91</span>
              <input required inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} className={cn(adminInput, 'rounded-l-none')} /></div></label>
          <label className="block"><span className="mb-1 block text-[12px] font-semibold text-slate-500">Date of birth</span>
            <input type="date" max={maxDob} value={f.dateOfBirth} onChange={(e) => setF({ ...f, dateOfBirth: e.target.value })} className={adminInput} /></label>
        </div>
        <div>
          <span className="mb-2 block text-[12px] font-semibold text-slate-500">Type</span>
          <div className="grid grid-cols-2 gap-3">
            {[['DRIVER_ONLY', 'Driver only'], ['DRIVER_WITH_VEHICLE', 'Driver with own vehicle']].map(([v, l]) => (
              <button type="button" key={v} onClick={() => setF({ ...f, registrationType: v })}
                className={cn('rounded-xl border-2 p-3 text-[14px] font-semibold', f.registrationType === v ? 'border-brand-orange bg-brand-sand text-brand-navy' : 'border-slate-200 text-slate-600')}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-2 block text-[12px] font-semibold text-slate-500">Vehicles the driver can drive</span>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES.map(({ code, icon: Icon }) => (
              <button type="button" key={code} onClick={() => toggle(code)}
                className={cn('inline-flex h-10 items-center gap-1.5 rounded-full border-2 px-3.5 text-[13px] font-semibold', f.vehicleTypes.includes(code) ? 'border-brand-orange bg-brand-orange text-white' : 'border-slate-200 text-brand-navy')}>
                <Icon className="h-4 w-4" /> {vehicleLabel(code)}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-[13px] text-red-600">{error}</p>}
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => navigate(-1)} className={cn(adminBtn, 'bg-white ring-1 ring-slate-200')}>Cancel</button>
        <button disabled={busy} className={cn(adminBtn, 'bg-gradient-to-r from-brand-orange to-brand-ember text-white shadow-gold')}><UserPlus className="h-4 w-4" /> {busy ? 'Saving…' : 'Register driver'}</button>
      </div>
    </form>
  );
};
