import type { TranslationKey } from './en';

/* A translation may leave keys out; missing ones fall back to English. */
export type Dict = Partial<Record<TranslationKey, string>>;
