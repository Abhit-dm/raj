import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Check, ExternalLink, FileText, MapPin, Phone, RotateCcw, ShieldCheck, Truck, X } from 'lucide-react';
import { adminService } from '../../services/adminApi';
import { apiError, fileUrl } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../lib/utils';
import { AdminStatus, adminBtn, adminInput, vehicleLabel } from './AdminPages';

const DOC_LABEL: Record<string, string> = {
  PROFILE_PHOTO: 'Profile photo', AADHAAR_CARD: 'Aadhaar card', DRIVING_LICENCE_FRONT: 'Driving licence (front)',
  DRIVING_LICENCE_BACK: 'Driving licence (back)', RC_BOOK: 'RC book', ADDRESS_PROOF: 'Address proof', PAN_CARD: 'PAN card',
};

type Doc = { id: string; documentType: string; fileUrl: string; mimeType: string; verificationStatus: string; rejectionReason?: string | null; uploadedAt: string };
type Detail = {
  id: string; fullName: string; registrationId: string; mobileNumber: string; dateOfBirth?: string | null; profilePhotoUrl?: string | null;
  registrationType: string; vehicleTypes: string[]; verificationStatus: string; createdAt: string; submittedAt?: string | null;
  isAvailable: boolean; locationUpdatedAt?: string | null; createdByAdmin: boolean;
  user: { phone?: string | null; language: string };
  address?: { doorNumber: string; street: string; village: string; district: string; state: string; pinCode: string } | null;
  drivingLicence?: { licenceNumber: string; licenceClass: string; issuingAuthority: string; issueDate: string; expiryDate: string; stateOfIssue: string } | null;
  drivingExperience?: { totalYears: number; preferredLocation?: string | null; previousCompany?: string | null; willingLongDistance: boolean } | null;
  emergencyContact?: { contactName: string; contactNumber: string; relationship: string } | null;
  documents: Doc[];
  vehicles: { id: string; category: string; manufacturer: string; model: string; registrationNumber: string; manufacturingYear: number; seatingCapacity: number; fuelType: string; colour: string; hasAC: boolean; verificationStatus: string }[];
};

const Info = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div><p className="text-[12px] text-slate-400">{label}</p><p className="text-[14px] font-medium text-brand-navy">{value || '—'}</p></div>
);
const Section = ({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) => (
  <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
    <div className="mb-4 flex items-center justify-between"><h2 className="text-[16px] font-bold text-brand-navy">{title}</h2>{right}</div>
    {children}
  </section>
);
const d = (v?: string | null) => (v ? format(new Date(v), 'd MMM yyyy') : '');

export const AdminDriverDetail = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [ask, setAsk] = useState<{ kind: 'doc'; doc: Doc } | { kind: 'driver'; status: 'REJECTED' | 'RESUBMISSION_REQUIRED' } | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');

  const { data: dr, isLoading } = useQuery<Detail>({ queryKey: ['admin-driver', id], queryFn: () => adminService.getDriver(id).then((r) => r.data.data) });

  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['admin-driver', id] }),
    qc.invalidateQueries({ queryKey: ['admin-stats'] }),
    qc.invalidateQueries({ queryKey: ['admin-drivers'] }),
  ]);

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try { await fn(); await refresh(); toast.success(ok); setAsk(null); setReason(''); }
    catch (e) { toast.error(apiError(e)); }
    finally { setBusy(''); }
  };

  if (isLoading || !dr) return <p className="p-10 text-center text-slate-400">Loading…</p>;
  const pendingDocs = dr.documents.filter((x) => x.verificationStatus === 'PENDING' || x.verificationStatus === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-500 hover:text-brand-navy"><ArrowLeft className="h-4 w-4" /> Back</button>

      {/* Header + decision buttons */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-ink p-5 text-white sm:flex-row sm:items-center">
        {dr.profilePhotoUrl
          ? <img src={fileUrl(dr.profilePhotoUrl)} alt="" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white/30" />
          : <span className="grid h-20 w-20 place-items-center rounded-2xl bg-brand-orange text-[30px] font-bold">{dr.fullName.charAt(0)}</span>}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[24px] font-bold">{dr.fullName}</h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-white/70">
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> +91 {dr.mobileNumber}</span>
            <span>{dr.registrationId}</span>
            <span>Joined {d(dr.createdAt)}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2"><AdminStatus status={dr.verificationStatus} />
            {dr.createdByAdmin && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold">Added by admin</span>}
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold">{dr.isAvailable ? '● Online' : 'Offline'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={!!busy || dr.verificationStatus === 'APPROVED'} onClick={() => run('approve', () => adminService.updateStatus(dr.id, 'APPROVED'), 'Driver approved')}
            className={cn(adminBtn, 'bg-emerald-500 text-white hover:bg-emerald-600')}><Check className="h-4 w-4" /> Accept driver</button>
          <button disabled={!!busy} onClick={() => setAsk({ kind: 'driver', status: 'RESUBMISSION_REQUIRED' })} className={cn(adminBtn, 'bg-white/10 text-white hover:bg-white/20')}><RotateCcw className="h-4 w-4" /> Ask to add again</button>
          <button disabled={!!busy || dr.verificationStatus === 'REJECTED'} onClick={() => setAsk({ kind: 'driver', status: 'REJECTED' })} className={cn(adminBtn, 'bg-red-500/90 text-white hover:bg-red-600')}><X className="h-4 w-4" /> Reject</button>
        </div>
      </div>

      {dr.verificationStatus === 'PROFILE_INCOMPLETE' && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-[14px] text-amber-800 ring-1 ring-amber-200">The driver has not finished the profile yet. Missing items appear as "—" below.</p>
      )}

      <Section title={`Documents (${dr.documents.length})`} right={pendingDocs ? <span className="text-[13px] font-semibold text-amber-600">{pendingDocs} waiting</span> : null}>
        {dr.documents.length === 0 ? <p className="text-[14px] text-slate-400">No documents uploaded yet.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dr.documents.map((doc) => {
              const isPdf = /pdf/i.test(doc.mimeType) || /\.pdf$/i.test(doc.fileUrl);
              return (
                <div key={doc.id} className={cn('overflow-hidden rounded-2xl ring-1', doc.documentType === 'RC_BOOK' ? 'ring-2 ring-brand-orange/50' : 'ring-slate-200')}>
                  <a href={fileUrl(doc.fileUrl)} target="_blank" rel="noreferrer" className="group relative block h-40 bg-slate-100">
                    {isPdf ? <span className="grid h-full place-items-center text-slate-400"><FileText className="h-10 w-10" /></span>
                      : <img src={fileUrl(doc.fileUrl)} alt="" className="h-full w-full object-cover" />}
                    <span className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100"><ExternalLink className="h-4 w-4" /></span>
                  </a>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-semibold text-brand-navy">{DOC_LABEL[doc.documentType] ?? doc.documentType}</p>
                      <AdminStatus status={doc.verificationStatus} />
                    </div>
                    <p className="text-[12px] text-slate-400">Uploaded {d(doc.uploadedAt)}</p>
                    {doc.rejectionReason && <p className="rounded-lg bg-orange-50 px-2.5 py-1.5 text-[12.5px] text-orange-800">{doc.rejectionReason}</p>}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button disabled={!!busy || doc.verificationStatus === 'VERIFIED'} onClick={() => run(doc.id, () => adminService.reviewDocument(doc.id, 'VERIFIED'), `${DOC_LABEL[doc.documentType]} accepted`)}
                        className={cn(adminBtn, 'h-9 bg-emerald-50 px-2 text-[13px] text-emerald-700 hover:bg-emerald-100')}><Check className="h-4 w-4" /> Accept</button>
                      <button disabled={!!busy} onClick={() => setAsk({ kind: 'doc', doc })}
                        className={cn(adminBtn, 'h-9 bg-orange-50 px-2 text-[13px] text-orange-700 hover:bg-orange-100')}><RotateCcw className="h-4 w-4" /> Re-upload</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Personal">
          <div className="grid grid-cols-2 gap-4">
            <Info label="Date of birth" value={d(dr.dateOfBirth)} />
            <Info label="App language" value={dr.user.language.toUpperCase()} />
            <Info label="Type" value={dr.registrationType === 'DRIVER_WITH_VEHICLE' ? 'Driver with vehicle' : 'Driver only'} />
            <Info label="Can drive" value={dr.vehicleTypes.map(vehicleLabel).join(', ')} />
            <Info label="Last location update" value={dr.locationUpdatedAt ? format(new Date(dr.locationUpdatedAt), 'd MMM, HH:mm') : ''} />
            <Info label="Sent for verification" value={d(dr.submittedAt)} />
          </div>
        </Section>
        <Section title="Address">
          {dr.address ? (
            <p className="flex gap-2 text-[14px] text-brand-navy"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />
              {dr.address.doorNumber}, {dr.address.street}, {dr.address.village}, {dr.address.district}, {dr.address.state} – {dr.address.pinCode}</p>
          ) : <p className="text-[14px] text-slate-400">—</p>}
          {dr.emergencyContact && (
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <Info label="Emergency contact" value={`${dr.emergencyContact.contactName} (${dr.emergencyContact.relationship})`} />
              <Info label="Contact number" value={dr.emergencyContact.contactNumber} />
            </div>
          )}
        </Section>
        <Section title="Driving licence">
          <div className="grid grid-cols-2 gap-4">
            <Info label="Number" value={dr.drivingLicence?.licenceNumber} />
            <Info label="Class" value={dr.drivingLicence?.licenceClass} />
            <Info label="Issued by" value={dr.drivingLicence && `${dr.drivingLicence.issuingAuthority}, ${dr.drivingLicence.stateOfIssue}`} />
            <Info label="Valid" value={dr.drivingLicence && `${d(dr.drivingLicence.issueDate)} – ${d(dr.drivingLicence.expiryDate)}`} />
          </div>
        </Section>
        <Section title="Experience">
          <div className="grid grid-cols-2 gap-4">
            <Info label="Years" value={dr.drivingExperience?.totalYears?.toString()} />
            <Info label="Long distance" value={dr.drivingExperience ? (dr.drivingExperience.willingLongDistance ? 'Yes' : 'No') : ''} />
            <Info label="Preferred location" value={dr.drivingExperience?.preferredLocation} />
            <Info label="Previous employer" value={dr.drivingExperience?.previousCompany} />
          </div>
        </Section>
      </div>

      {dr.vehicles.length > 0 && (
        <Section title="Own vehicle">
          {dr.vehicles.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-orange/10 text-brand-orange"><Truck className="h-6 w-6" /></span>
              <div className="flex-1">
                <p className="font-bold text-brand-navy">{v.registrationNumber}</p>
                <p className="text-[13px] text-slate-500">{vehicleLabel(v.category)} · {v.manufacturer} {v.model} · {v.manufacturingYear} · {v.seatingCapacity} seats · {v.fuelType} · {v.colour}{v.hasAC ? ' · AC' : ''}</p>
              </div>
              <AdminStatus status={v.verificationStatus} />
            </div>
          ))}
        </Section>
      )}

      {/* Reason dialog */}
      {ask && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button aria-label="Close" className="absolute inset-0 bg-black/50" onClick={() => setAsk(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-[18px] font-bold text-brand-navy">
              {ask.kind === 'doc' ? `Ask to re-upload: ${DOC_LABEL[ask.doc.documentType]}` : ask.status === 'REJECTED' ? 'Reject driver' : 'Ask driver to add documents again'}
            </h3>
            <p className="mt-1 text-[13px] text-slate-500">The driver sees this message in the app.</p>
            <textarea autoFocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder={ask.kind === 'doc' ? 'e.g. Photo is blurry, please upload a clear photo of the front side' : 'Reason'}
              className={cn(adminInput, 'mt-4 h-auto py-3')} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setAsk(null)} className={cn(adminBtn, 'bg-slate-100')}>Cancel</button>
              <button
                disabled={!reason.trim() || !!busy}
                onClick={() => ask.kind === 'doc'
                  ? run('ask', () => adminService.reviewDocument(ask.doc.id, 'RESUBMISSION_REQUIRED', reason.trim()), 'Driver asked to re-upload')
                  : run('ask', () => adminService.updateStatus(dr.id, ask.status, reason.trim()), ask.status === 'REJECTED' ? 'Driver rejected' : 'Driver asked to add again')}
                className={cn(adminBtn, ask.kind === 'driver' && ask.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-brand-orange text-white')}
              >
                <ShieldCheck className="h-4 w-4" /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
