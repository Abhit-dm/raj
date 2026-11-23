import { Check } from 'lucide-react';
import { Sheet } from '../../components/app/ui';
import { LANGUAGES, useLangStore, useT } from '../../i18n';
import { cn } from '../../lib/utils';

/* Grid of Indian languages; picking one switches the whole app immediately */
export const LanguageGrid = ({ value, onPick }: { value: string; onPick: (code: string) => void }) => (
  <div className="grid grid-cols-2 gap-3">
    {LANGUAGES.map((l) => {
      const selected = value === l.code;
      return (
        <button
          key={l.code}
          type="button"
          onClick={() => onPick(l.code)}
          aria-pressed={selected}
          className={cn('pressable relative flex items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left shadow-card',
            selected ? 'border-brand-orange bg-brand-sand' : 'border-transparent')}
        >
          <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[20px] font-bold',
            selected ? 'bg-brand-orange text-white' : 'bg-brand-navy/5 text-brand-navy')}>{l.letter}</span>
          <span className="min-w-0">
            <span className="block truncate text-[16px] font-bold text-brand-navy">{l.native}</span>
            <span className="block text-[12px] text-slate-500">{l.english}</span>
          </span>
          {selected && <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-brand-orange" strokeWidth={3} />}
        </button>
      );
    })}
  </div>
);

export const LanguageSheet = ({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged?: (code: string) => void }) => {
  const t = useT();
  const { lang, setLang } = useLangStore();
  return (
    <Sheet open={open} onClose={onClose} title={t('language')}>
      <div className="max-h-[60vh] overflow-y-auto pb-1 no-scrollbar">
        <LanguageGrid value={lang} onPick={(code) => { setLang(code); onChanged?.(code); onClose(); }} />
      </div>
    </Sheet>
  );
};
