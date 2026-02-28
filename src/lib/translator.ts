import type { TranslationProvider } from '@/types';

// --- DeepL Provider ---

class DeepLProvider implements TranslationProvider {
  name = 'DeepL';
  private apiKey: string;
  private quotaExceeded = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && !this.quotaExceeded;
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        source_lang: from.toUpperCase(),
        target_lang: this.mapTargetLang(to),
        tag_handling: 'html',
      }),
    });

    if (response.status === 456) {
      this.quotaExceeded = true;
      throw new QuotaExceededError('DeepL quota exceeded');
    }

    if (!response.ok) {
      throw new Error(`DeepL error: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.translations[0].text;
  }

  private mapTargetLang(lang: string): string {
    const map: Record<string, string> = {
      'pt': 'PT-BR',
      'en': 'EN-US',
      'es': 'ES',
      'fr': 'FR',
      'de': 'DE',
      'it': 'IT',
      'ja': 'JA',
      'ko': 'KO',
      'zh': 'ZH-HANS',
      'ru': 'RU',
    };
    return map[lang] ?? lang.toUpperCase();
  }
}

// --- NLLB-200 Provider (HuggingFace) ---

class NLLBProvider implements TranslationProvider {
  name = 'NLLB-200';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    // Strip HTML for NLLB (doesn't support tag_handling)
    const plainText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-1.3B',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: plainText,
          parameters: {
            src_lang: this.mapLang(from),
            tgt_lang: this.mapLang(to),
          },
        }),
      },
    );

    if (response.status === 503) {
      // Model is loading, retry after delay
      await new Promise((resolve) => setTimeout(resolve, 20000));
      return this.translate(text, from, to);
    }

    if (!response.ok) {
      throw new Error(`NLLB error: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data[0]?.translation_text ?? plainText;
  }

  private mapLang(lang: string): string {
    const map: Record<string, string> = {
      'en': 'eng_Latn',
      'pt': 'por_Latn',
      'es': 'spa_Latn',
      'fr': 'fra_Latn',
      'de': 'deu_Latn',
      'it': 'ita_Latn',
      'ja': 'jpn_Jpan',
      'ko': 'kor_Hang',
      'zh': 'zho_Hans',
      'ru': 'rus_Cyrl',
    };
    return map[lang] ?? 'eng_Latn';
  }
}

// --- Errors ---

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

// --- Translator Service (Strategy Pattern) ---

class TranslatorService {
  private providers: TranslationProvider[];

  constructor(providers: TranslationProvider[]) {
    this.providers = providers;
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        try {
          return await provider.translate(text, from, to);
        } catch (error) {
          if (error instanceof QuotaExceededError) {
            continue; // Try next provider
          }
          throw error;
        }
      }
    }
    throw new Error('Nenhum provedor de tradução disponível. Configure DEEPL_API_KEY ou HUGGINGFACE_API_KEY.');
  }

  async translateBatch(
    texts: string[],
    from: string,
    to: string,
    onProgress?: (translated: number, total: number) => void,
  ): Promise<string[]> {
    const results: string[] = [];
    for (let i = 0; i < texts.length; i++) {
      const translated = await this.translate(texts[i], from, to);
      results.push(translated);
      onProgress?.(i + 1, texts.length);
    }
    return results;
  }
}

// --- Singleton ---

let translatorInstance: TranslatorService | null = null;

export function getTranslator(): TranslatorService {
  if (!translatorInstance) {
    const providers: TranslationProvider[] = [];

    if (process.env.DEEPL_API_KEY) {
      providers.push(new DeepLProvider(process.env.DEEPL_API_KEY));
    }
    if (process.env.HUGGINGFACE_API_KEY) {
      providers.push(new NLLBProvider(process.env.HUGGINGFACE_API_KEY));
    }

    translatorInstance = new TranslatorService(providers);
  }
  return translatorInstance;
}
