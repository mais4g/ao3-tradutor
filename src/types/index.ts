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
