export type FanficStatus = 'pending' | 'scraping' | 'translating' | 'completed' | 'error';

export interface Fanfic {
  id: string;
  user_id: string;
  work_id: string;
  url: string;
  title_original: string | null;
  title_translated: string | null;
  author: string;
  language_from: string;
  language_to: string;
  status: FanficStatus;
  progress: number;
  error_message: string | null;
  epub_path: string | null;
  content_path: string | null;
  word_count: number;
  total_paragraphs: number;
  translated_paragraphs: number;
  created_at: string;
  updated_at: string;
}

export interface ScrapedFanfic {
  workId: string;
  url: string;
  title: string;
  author: string;
  languageFrom: string;
  paragraphs: string[];
}

export interface TranslationProvider {
  name: string;
  translate(text: string, from: string, to: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export interface TranslateRequest {
  urls: string[];
  languageTo?: string;
}

export interface TranslateContinueRequest {
  fanficId: string;
}

export interface EpubContent {
  title: string;
  titleOriginal: string;
  author: string;
  sourceUrl: string;
  chapters: { title: string; content: string }[];
}

// Reader content (stored as JSON alongside EPUB)
export interface FanficContent {
  chapters: {
    title: string;
    content: string;
  }[];
  metadata: {
    title: string;
    titleOriginal: string;
    author: string;
    sourceUrl: string;
    wordCount: number;
  };
}

// User preferences
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type ReadingTheme = 'light' | 'dark' | 'sepia';
export type ReadingMode = 'scroll' | 'paginated';
export type TextWidth = 'narrow' | 'medium' | 'wide';

export interface UserPreferences {
  id: string;
  user_id: string;
  font_size: FontSize;
  reading_theme: ReadingTheme;
  reading_mode: ReadingMode;
  text_width: TextWidth;
}

// Reading progress
export interface ReadingProgress {
  id: string;
  user_id: string;
  fanfic_id: string;
  current_chapter: number;
  scroll_position: number;
  progress_percent: number;
  last_read_at: string;
}

// Library filters
export interface LibraryFilters {
  search?: string;
  status?: FanficStatus | 'all';
  language?: string;
  sortBy?: 'created_at' | 'title_translated' | 'author' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// Stats
export interface TranslationStats {
  totalFanfics: number;
  completed: number;
  inProgress: number;
  errors: number;
  totalParagraphs: number;
  translatedParagraphs: number;
  totalWordCount: number;
}
