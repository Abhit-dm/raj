import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';
import { ScreenTitle, Spinner, StatusPill } from '../../components/app/ui';
import { PhotoPicker } from '../../components/app/PhotoPicker';
import { useToast } from '../../components/ui/Toast';
import { useT, type TranslationKey } from '../../i18n';
import { documentService, fileUrl } from '../../services/api';
import { uploadDocument } from '../../services/cloudinary';
import { cn } from '../../lib/utils';
import { requiredDocs, useDriver, type DriverDoc } from './useDriver';

const OPTIONAL_DOCS = ['ADDRESS_PROOF', 'PAN_CARD'];

export const DriverDocuments = () => {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: d, isLoading } = useDriver();
  const [picking, setPicking] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  if (isLoading || !d) return <Spinner className="flex-1" />;

  const upload = async (type: string, file: File) => {
    setUploading(type);
    try {
      const res = await uploadDocument(file, type);
      await documentService.saveUrl({ documentType: type, fileUrl: res.url, fileName: file.name, mimeType: file.type || 'image/jpeg', fileSize: res.bytes });
      await qc.invalidateQueries({ queryKey: ['driver-me'] });
      toast.success(t('saved'));
    } catch (e) {
      toast.error((e as Error).message || t('something_wrong'));
    } finally {
      setUploading(null);
    }
  };

  const req = requiredDocs(d);
  const docOf = (type: string) => d.documents.find((x) => x.documentType === type);

  return (
    <div className="pb-6" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <ScreenTitle title={t('documents_title')} sub={t('documents_sub')} />
      <div className="space-y-3 px-4">
        {req.map((type) => (
          <DocRow key={type} type={type} doc={docOf(type)} uploading={uploading === type} onPick={() => setPicking(type)} />
        ))}
        <p className="px-1 pt-3 text-[13px] font-semibold uppercase tracking-wide text-slate-400">{t('optional')}</p>
        {OPTIONAL_DOCS.map((type) => (
          <DocRow key={type} type={type} doc={docOf(type)} uploading={uploading === type} onPick={() => setPicking(type)} />
        ))}
      </div>
      <PhotoPicker
        open={!!picking}
        title={picking ? t(`doc_${picking}` as TranslationKey) : ''}
        onClose={() => setPicking(null)}
        allowPdf={picking !== 'PROFILE_PHOTO'}
        onFile={(file) => { const type = picking!; void upload(type, file); }}
      />
    </div>
  );
};

const DocRow = ({ type, doc, uploading, onPick }: { type: string; doc?: DriverDoc; uploading: boolean; onPick: () => void }) => {
  const t = useT();
  const needsFix = doc && (doc.verificationStatus === 'RESUBMISSION_REQUIRED' || doc.verificationStatus === 'REJECTED');
  const isImage = doc && !/pdf/i.test(doc.mimeType) && !/\.pdf$/i.test(doc.fileUrl);
  const locked = doc?.verificationStatus === 'VERIFIED';

  return (
    <div className={cn('flex items-center gap-3.5 rounded-3xl bg-white p-3.5 shadow-card', needsFix && 'ring-2 ring-red-300')}>
      <button
        onClick={() => doc && window.open(fileUrl(doc.fileUrl), '_blank')}
        className={cn('grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl', doc ? 'bg-slate-100' : 'border-2 border-dashed border-slate-200 bg-slate-50')}
        aria-label={t(`doc_${type}` as TranslationKey)}
      >
        {isImage ? <img src={fileUrl(doc.fileUrl)} alt="" className="h-full w-full object-cover" /> : <FileText className="h-6 w-6 text-slate-400" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-brand-navy">{t(`doc_${type}` as TranslationKey)}</p>
        <div className="mt-1">
          {doc
            ? <StatusPill status={doc.verificationStatus} label={t(`doc_status_${doc.verificationStatus}` as TranslationKey)} />
            : <span className="text-[13px] text-slate-400">{t('not_uploaded')}</span>}
        </div>
        {needsFix && doc?.rejectionReason && (
          <p className="mt-1.5 flex items-start gap-1 text-[12.5px] leading-snug text-red-600"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{doc.rejectionReason}</p>
        )}
      </div>
      {locked ? (
        <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-500" />
      ) : (
        <button
          onClick={onPick}
          disabled={uploading}
          className={cn('pressable flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-bold',
            !doc || needsFix ? 'bg-brand-orange text-white shadow-gold' : 'bg-brand-navy/5 text-brand-navy')}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? '' : !doc ? t('upload') : needsFix ? t('reupload') : t('edit')}
        </button>
      )}
    </div>
  );
};
