import type { FontSize, ReadingTheme, ReadingMode, TextWidth } from '@/types';

export const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '0.875rem',
  medium: '1rem',
  large: '1.25rem',
  'extra-large': '1.5rem',
} as const;

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
  'extra-large': 'Extra grande',
} as const;

export const TEXT_WIDTH_MAP: Record<TextWidth, string> = {
  narrow: 'max-w-xl',
  medium: 'max-w-2xl',
  wide: 'max-w-4xl',
} as const;

export const TEXT_WIDTH_LABELS: Record<TextWidth, string> = {
  narrow: 'Estreito',
  medium: 'Médio',
  wide: 'Largo',
} as const;

export const READING_THEME_LABELS: Record<ReadingTheme, string> = {
  light: 'Claro',
  dark: 'Escuro',
  sepia: 'Sépia',
} as const;

export const READING_MODE_LABELS: Record<ReadingMode, string> = {
  scroll: 'Scroll contínuo',
  paginated: 'Por capítulo',
} as const;

export const LANGUAGES = [
  { value: 'pt', label: 'Português (BR)' },
  { value: 'es', label: 'Espanhol' },
  { value: 'fr', label: 'Francês' },
  { value: 'de', label: 'Alemão' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: 'Japonês' },
  { value: 'ko', label: 'Coreano' },
  { value: 'zh', label: 'Chinês' },
  { value: 'ru', label: 'Russo' },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  scraping: 'Extraindo',
  translating: 'Traduzindo',
  completed: 'Completo',
  error: 'Erro',
} as const;
