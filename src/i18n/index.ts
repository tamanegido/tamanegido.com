import { ja } from './ja';
import { en } from './en';

export const translations = {
  ja,
  en,
} as const;

export type Language = keyof typeof translations;
export type Translation = typeof ja;

export const defaultLang: Language = 'ja';
export const languages: Language[] = ['ja', 'en'];

export function getLangFromPath(pathname: string): Language {
  const lang = pathname.split('/')[1];
  return (languages.includes(lang as Language) ? lang : defaultLang) as Language;
}

export function getTranslations(lang: Language): Translation {
  return translations[lang];
}

