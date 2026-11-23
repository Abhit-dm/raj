import { useRef } from 'react';
import { Camera, Images } from 'lucide-react';
import { Sheet } from './ui';
import { useT } from '../../i18n';

/* Bottom sheet: take a photo with the camera, or pick from gallery / files */
export const PhotoPicker = ({ open, onClose, onFile, title, allowPdf = true }: {
  open: boolean; onClose: () => void; onFile: (file: File) => void; title?: string; allowPdf?: boolean;
}) => {
  const t = useT();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) { onClose(); onFile(file); }
  };

  return (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handle} />
      <input ref={fileRef} type="file" accept={allowPdf ? 'image/jpeg,image/png,application/pdf' : 'image/jpeg,image/png'} className="hidden" onChange={handle} />
      <Sheet open={open} onClose={onClose} title={title}>
        <div className="grid grid-cols-2 gap-3 pb-2">
          <button onClick={() => cameraRef.current?.click()} className="pressable flex flex-col items-center gap-3 rounded-3xl bg-brand-navy p-5 text-white">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><Camera className="h-7 w-7" /></span>
            <span className="text-[15px] font-semibold">{t('take_photo')}</span>
          </button>
          <button onClick={() => fileRef.current?.click()} className="pressable flex flex-col items-center gap-3 rounded-3xl bg-brand-sand p-5 text-brand-navy ring-1 ring-brand-orange/20">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-orange text-white"><Images className="h-7 w-7" /></span>
            <span className="text-center text-[14px] font-semibold leading-tight">{t('choose_file')}</span>
          </button>
        </div>
      </Sheet>
    </>
  );
};
