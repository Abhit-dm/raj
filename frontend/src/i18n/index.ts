import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { en, type TranslationKey } from './en';
import type { Dict } from './types';
import { hi } from './hi';
import { te } from './te';
import { ta } from './ta';
import { kn } from './kn';
import { ml } from './ml';
import { mr } from './mr';
import { bn } from './bn';
import { gu } from './gu';
import { pa } from './pa';
import { or } from './or';

export type { TranslationKey };

export const LANGUAGES = [
  { code: 'en', native: 'English', english: 'English', letter: 'A' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi', letter: 'अ' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu', letter: 'అ' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil', letter: 'அ' },
  { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada', letter: 'ಅ' },
  { code: 'ml', native: 'മലയാളം', english: 'Malayalam', letter: 'അ' },
  { code: 'mr', native: 'मराठी', english: 'Marathi', letter: 'म' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali', letter: 'অ' },
  { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati', letter: 'અ' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi', letter: 'ਅ' },
  { code: 'or', native: 'ଓଡ଼ିଆ', english: 'Odia', letter: 'ଅ' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const DICTS: Record<LanguageCode, Dict> = { en, hi, te, ta, kn, ml, mr, bn, gu, pa, or };

const isLanguage = (code: unknown): code is LanguageCode => LANGUAGES.some((l) => l.code === code);

type LangState = { lang: LanguageCode; setLang: (code: string) => void };

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (code) => {
        if (!isLanguage(code)) return;
        document.documentElement.lang = code;
        set({ lang: code });
      },
    }),
    { name: 'rw-language' },
  ),
);

export const translate = (lang: LanguageCode, key: TranslationKey, vars?: Record<string, string | number>) => {
  let text = DICTS[lang]?.[key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
  return text;
};

/* const t = useT();  t('next'), t('steps_done', { n: 2, t: 6 }) */
export const useT = () => {
  const lang = useLangStore((s) => s.lang);
  return useCallback((key: TranslationKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
};
