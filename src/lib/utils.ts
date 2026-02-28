import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*]/g;
const MAX_FILENAME_LENGTH = 100;

export function sanitizeFilename(name: string): string {
  const cleaned = name.replace(INVALID_FILENAME_CHARS, '').trim();
  return cleaned.length > MAX_FILENAME_LENGTH
    ? cleaned.slice(0, MAX_FILENAME_LENGTH)
    : cleaned;
}

const WORK_ID_REGEX = /\/works\/(\d+)/;

export function extractWorkId(url: string): string | null {
  const match = url.match(WORK_ID_REGEX);
  return match ? match[1] : null;
}

const LANGUAGE_MAP: Record<string, string> = {
  'English': 'en',
  'Português europeu': 'pt',
  'Português brasileiro': 'pt',
  'Español': 'es',
  'Français': 'fr',
  'Deutsch': 'de',
  'Italiano': 'it',
  '中文-普通话 國語': 'zh',
  '日本語': 'ja',
  '한국어': 'ko',
  'Русский': 'ru',
};

export function mapLanguage(langText: string): string {
  const trimmed = langText.trim();
  return LANGUAGE_MAP[trimmed] ?? 'en';
}

export function isAO3Url(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'archiveofourown.org' ||
      parsed.hostname === 'www.archiveofourown.org' ||
      parsed.hostname.endsWith('.archiveofourown.org')
    );
  } catch {
    return false;
  }
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
