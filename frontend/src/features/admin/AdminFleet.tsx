import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Building2, Check, ChevronRight, ExternalLink, Phone, RotateCcw, Search, X } from 'lucide-react';
import { adminService } from '../../services/adminApi';
import { apiError, fileUrl } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../lib/utils';
import { AdminStatus, adminBtn, adminInput, vehicleLabel } from './AdminPages';

type OwnerRow = {
  id: string; firstName: string; lastName: string; mobileNumber: string; companyName?: string | null; city?: string | null;
  verificationStatus: string; createdAt: string; _count: { vehicles: number };
};

export const AdminFleetOwnersPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const status = params.get('status') ?? '';
  const [search, setSearch] = useState('');
  const { data = [], isLoading } = useQuery<OwnerRow[]>({
    queryKey: ['admin-fleet', status, search],
    queryFn: () => adminService.getFleetOwners({ status: status || undefined, search: search || undefined }).then((r) => r.data.data),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[24px] font-bold text-brand-navy">{status === 'pending' ? 'Fleet owners waiting approval' : 'Fleet owners'}</h1>
        <p className="text-[14px] text-slate-500">{data.length} owner{data.length === 1 ? '' : 's'}</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, company or mobile" className={cn(adminInput, 'pl-10')} />
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {isLoading ? <p className="p-10 text-center text-slate-400">Loading…</p> : data.length === 0 ? <p className="p-10 text-center text-slate-400">No fleet owners here.</p> : (
          <ul className="divide-y divide-slate-100">
            {data.map((o) => (
              <li key={o.id}>
                <button onClick={() => navigate(`/admin/fleet-owners/${o.id}`)} className="flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-slate-50">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-navy text-white"><Building2 className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-brand-navy">{o.firstName} {o.lastName}{o.companyName ? ` · ${o.companyName}` : ''}</span>
                    <span className="block text-[13px] text-slate-500">+91 {o.mobileNumber}{o.city ? ` · ${o.city}` : ''} · {o._count.vehicles} vehicle{o._count.vehicles === 1 ? '' : 's'} · joined {format(new Date(o.createdAt), 'd MMM yyyy')}</span>
                  </span>
                  <AdminStatus status={o.verificationStatus} />
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

type OwnerDetail = OwnerRow & {
  rejectionReason?: string | null; user: { language: string };
  vehicles: { id: string; vehicleType: string; registrationNumber: string; manufacturer: string; model: string; manufacturingYear?: number | null; capacity?: string | null; photos: string[]; rcUrl?: string | null; verificationStatus: string }[];
};

export const AdminFleetOwnerDetail = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [ask, setAsk] = useState<'REJECTED' | 'RESUBMISSION_REQUIRED' | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const { data: o, isLoading } = useQuery<OwnerDetail>({ queryKey: ['admin-fleet-owner', id], queryFn: () => adminService.getFleetOwner(id).then((r) => r.data.data) });

  const setStatus = async (status: string, why?: string) => {
    setBusy(true);
    try {
      await adminService.updateFleetOwnerStatus(id, status, why);
      await Promise.all([qc.invalidateQueries({ queryKey: ['admin-fleet-owner', id] }), qc.invalidateQueries({ queryKey: ['admin-stats'] }), qc.invalidateQueries({ queryKey: ['admin-fleet'] })]);
      toast.success('Status updated');
      setAsk(null); setReason('');
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  if (isLoading || !o) return <p className="p-10 text-center text-slate-400">Loading…</p>;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-500 hover:text-brand-navy"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-ink p-5 text-white sm:flex-row sm:items-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-orange"><Building2 className="h-8 w-8" /></span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[24px] font-bold">{o.firstName} {o.lastName}</h1>
          <p className="flex flex-wrap gap-x-3 text-[14px] text-white/70"><span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> +91 {o.mobileNumber}</span>{o.companyName && <span>{o.companyName}</span>}{o.city && <span>{o.city}</span>}</p>
          <div className="mt-2 flex gap-2"><AdminStatus status={o.verificationStatus} /></div>
          {o.rejectionReason && <p className="mt-2 text-[13px] text-orange-200">Reason given: {o.rejectionReason}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy || o.verificationStatus === 'APPROVED'} onClick={() => setStatus('APPROVED')} className={cn(adminBtn, 'bg-emerald-500 text-white')}><Check className="h-4 w-4" /> Accept</button>
          <button disabled={busy} onClick={() => setAsk('RESUBMISSION_REQUIRED')} className={cn(adminBtn, 'bg-white/10 text-white')}><RotateCcw className="h-4 w-4" /> Ask to add again</button>
          <button disabled={busy} onClick={() => setAsk('REJECTED')} className={cn(adminBtn, 'bg-red-500/90 text-white')}><X className="h-4 w-4" /> Reject</button>
        </div>
      </div>

      <h2 className="text-[17px] font-bold text-brand-navy">Fleet ({o.vehicles.length})</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {o.vehicles.map((v) => (
          <div key={v.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="grid grid-cols-3 gap-0.5 bg-slate-100">
              {v.photos.map((p) => (
                <a key={p} href={fileUrl(p)} target="_blank" rel="noreferrer"><img src={fileUrl(p)} alt="" className="h-28 w-full object-cover" /></a>
              ))}
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <p className="font-bold text-brand-navy">{v.registrationNumber}</p>
                <p className="text-[13px] text-slate-500">{vehicleLabel(v.vehicleType)} · {v.manufacturer} {v.model}{v.manufacturingYear ? ` · ${v.manufacturingYear}` : ''}{v.capacity ? ` · ${v.capacity}` : ''}</p>
                {v.rcUrl && <a href={fileUrl(v.rcUrl)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-orange">RC book <ExternalLink className="h-3.5 w-3.5" /></a>}
              </div>
              <AdminStatus status={v.verificationStatus} />
            </div>
          </div>
        ))}
      </div>

      {ask && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button aria-label="Close" className="absolute inset-0 bg-black/50" onClick={() => setAsk(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-[18px] font-bold text-brand-navy">{ask === 'REJECTED' ? 'Reject fleet owner' : 'Ask to add details again'}</h3>
            <textarea autoFocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (shown to the owner)" className={cn(adminInput, 'mt-4 h-auto py-3')} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setAsk(null)} className={cn(adminBtn, 'bg-slate-100')}>Cancel</button>
              <button disabled={!reason.trim() || busy} onClick={() => setStatus(ask, reason.trim())} className={cn(adminBtn, ask === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-brand-orange text-white')}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
