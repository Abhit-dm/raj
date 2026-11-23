import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, ImagePlus, Loader2, X } from 'lucide-react';
import { BottomAction, Btn, Chip, Field, ScreenTitle, TopBar } from '../../components/app/ui';
import { PhotoPicker } from '../../components/app/PhotoPicker';
import { useToast } from '../../components/ui/Toast';
import { useT } from '../../i18n';
import { fleetService, apiError, fileUrl } from '../../services/api';
import { uploadDocument } from '../../services/cloudinary';
import { VEHICLE_TYPES } from '../../config/vehicles';
import { cn } from '../../lib/utils';

const MAX_PHOTOS = 6;

export const FleetAddVehicle = () => {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [v, setV] = useState({ vehicleType: '', registrationNumber: '', manufacturer: '', model: '', manufacturingYear: '', capacity: '' });
  const [photos, setPhotos] = useState<string[]>([]);
  const [rcUrl, setRcUrl] = useState('');
  const [picker, setPicker] = useState<'photo' | 'rc' | null>(null);
  const [uploading, setUploading] = useState<'photo' | 'rc' | null>(null);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof v, value: string) => setV((s) => ({ ...s, [k]: value }));
  const year = Number(v.manufacturingYear);
  const errors = {
    vehicleType: !v.vehicleType ? t('required') : '',
    registrationNumber: v.registrationNumber.replace(/\s/g, '').length < 6 ? t('required') : '',
    manufacturer: !v.manufacturer.trim() ? t('required') : '',
    model: !v.model.trim() ? t('required') : '',
    manufacturingYear: v.manufacturingYear && (year < 1980 || year > new Date().getFullYear() + 1) ? t('something_wrong') : '',
    photos: photos.length === 0 ? t('required') : '',
  };
  const valid = Object.values(errors).every((e) => !e);

  const upload = async (file: File, kind: 'photo' | 'rc') => {
    setUploading(kind);
    try {
      const res = await uploadDocument(file, kind === 'rc' ? 'RC_BOOK' : 'VEHICLE_PHOTO', 'fleet');
      if (kind === 'rc') setRcUrl(res.url);
      else setPhotos((p) => [...p, res.url].slice(0, MAX_PHOTOS));
    } catch (e) {
      toast.error((e as Error).message || t('something_wrong'));
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setTouched(true);
    if (!valid) return;
    setSaving(true);
    try {
      await fleetService.addVehicle({ ...v, registrationNumber: v.registrationNumber.replace(/\s/g, ''), manufacturingYear: v.manufacturingYear || undefined, photos, rcUrl: rcUrl || undefined });
      await qc.invalidateQueries({ queryKey: ['fleet-me'] });
      toast.success(t('saved'));
      navigate('/fleet', { replace: true });
    } catch (e) {
      toast.error(apiError(e, t('something_wrong')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar />
      <ScreenTitle title={t('add_vehicle')} className="pt-1" />
      <div className="space-y-5 px-5 pb-4">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-slate-600">{t('vehicle_type')}</p>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES.map(({ code, icon: Icon, key }) => (
              <Chip key={code} selected={v.vehicleType === code} onClick={() => set('vehicleType', code)} icon={<Icon className={cn('h-[18px] w-[18px]', v.vehicleType === code ? 'text-white' : 'text-brand-orange')} />}>{t(key)}</Chip>
            ))}
          </div>
          {touched && errors.vehicleType && <p className="mt-1.5 text-[13px] text-red-500">{errors.vehicleType}</p>}
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-slate-600">{t('vehicle_photos')} <span className="font-normal text-slate-400">({photos.length}/{MAX_PHOTOS})</span></p>
          <div className="grid grid-cols-3 gap-2.5">
            {photos.map((p) => (
              <div key={p} className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                <img src={fileUrl(p)} alt="" className="h-full w-full object-cover" />
                <button aria-label={t('remove')} onClick={() => setPhotos((s) => s.filter((x) => x !== p))} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button onClick={() => setPicker('photo')} disabled={uploading === 'photo'} className={cn('pressable flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed bg-white text-brand-orange', touched && errors.photos ? 'border-red-300' : 'border-brand-orange/40')}>
                {uploading === 'photo' ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
                <span className="text-[12px] font-semibold">{t('add_photo')}</span>
              </button>
            )}
          </div>
          {touched && errors.photos && <p className="mt-1.5 text-[13px] text-red-500">{errors.photos}</p>}
        </div>

        <Field label={t('reg_no')} placeholder="TS 09 AB 1234" value={v.registrationNumber} onChange={(e) => set('registrationNumber', e.target.value.toUpperCase())} error={touched ? errors.registrationNumber : ''} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('make')} placeholder="Tata" value={v.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} error={touched ? errors.manufacturer : ''} />
          <Field label={t('model')} placeholder="Signa 4825" value={v.model} onChange={(e) => set('model', e.target.value)} error={touched ? errors.model : ''} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('year')} inputMode="numeric" maxLength={4} placeholder="2022" value={v.manufacturingYear} onChange={(e) => set('manufacturingYear', e.target.value.replace(/\D/g, ''))} error={touched ? errors.manufacturingYear : ''} />
          <Field label={t('capacity')} placeholder="25 T" value={v.capacity} onChange={(e) => set('capacity', e.target.value)} />
        </div>

        <button onClick={() => setPicker('rc')} className="pressable flex w-full items-center gap-3.5 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-3.5 text-left">
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100">
            {uploading === 'rc' ? <Loader2 className="h-5 w-5 animate-spin text-brand-orange" />
              : rcUrl && !/\.pdf$/i.test(rcUrl) ? <img src={fileUrl(rcUrl)} alt="" className="h-full w-full object-cover" /> : <FileText className="h-5 w-5 text-slate-400" />}
          </span>
          <span className="flex-1 text-[15px] font-semibold text-brand-navy">{t('rc_photo')}</span>
          <span className="text-[13px] font-semibold text-brand-orange">{rcUrl ? t('edit') : t('upload')}</span>
        </button>
      </div>

      <BottomAction><Btn onClick={save} loading={saving} disabled={!!uploading}>{t('save')}</Btn></BottomAction>

      <PhotoPicker
        open={!!picker}
        onClose={() => setPicker(null)}
        allowPdf={picker === 'rc'}
        title={picker === 'rc' ? t('rc_photo') : t('add_photo')}
        onFile={(file) => { const kind = picker!; void upload(file, kind); }}
      />
    </>
  );
};
