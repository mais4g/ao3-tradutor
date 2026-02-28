import * as cheerio from 'cheerio';
import type { ScrapedFanfic } from '@/types';
import { extractWorkId, mapLanguage } from './utils';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CONTENT_SELECTORS = 'p, h2, h3, h4, blockquote, li';

export async function scrapeWork(url: string): Promise<ScrapedFanfic> {
  const workId = extractWorkId(url);
  if (!workId) {
    throw new Error(`URL inválida: não foi possível extrair work ID de "${url}"`);
  }

  const fullUrl = `https://archiveofourown.org/works/${workId}?view_full_work=true&view_adult=true`;

  const response = await fetch(fullUrl, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'manual',
  });

  // Detect restricted content
  const location = response.headers.get('location');
  if (location?.includes('restricted=true')) {
    throw new Error('Conteúdo restrito: é necessário estar logado no AO3 para acessar esta obra.');
  }

  if (!response.ok && response.status !== 302) {
    throw new Error(`Erro ao acessar AO3: HTTP ${response.status}`);
  }

  // If redirected, follow manually
  let html: string;
  if (response.status >= 300 && response.status < 400 && location) {
    const redirectResponse = await fetch(location, {
      headers: { 'User-Agent': USER_AGENT },
    });
    html = await redirectResponse.text();
  } else {
    html = await response.text();
  }

  const $ = cheerio.load(html);

  // Extract title
  const title =
    $('h2.title').first().text().trim() ||
    $('div.meta h1').first().text().trim() ||
    'Sem Título';

  // Extract author
  const author =
    $('dd.author a[rel="author"]').first().text().trim() ||
    $('a[rel="author"]').first().text().trim() ||
    'Anonymous';

  // Extract language
  const langText = $('dd.language').first().text().trim() || 'English';
  const languageFrom = mapLanguage(langText);

  // Extract content paragraphs
  const chaptersDiv = $('div#chapters');
  if (!chaptersDiv.length) {
    throw new Error('Não foi possível encontrar o conteúdo da obra.');
  }

  const paragraphs: string[] = [];
  chaptersDiv.find(CONTENT_SELECTORS).each((_, el) => {
    const element = $(el);
    const htmlContent = element.html();
    if (htmlContent && htmlContent.trim()) {
      const tag = el.type === 'tag' ? el.tagName : 'p';
      paragraphs.push(`<${tag}>${htmlContent.trim()}</${tag}>`);
    }
  });

  if (paragraphs.length === 0) {
    throw new Error('Nenhum conteúdo encontrado na obra.');
  }

  return {
    workId,
    url: fullUrl,
    title,
    author,
    languageFrom,
    paragraphs,
  };
}

export async function scrapeSeriesWorkUrls(seriesUrl: string): Promise<string[]> {
  const response = await fetch(seriesUrl, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Erro ao acessar série: HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const urls: string[] = [];
  $('h4.heading a').each((_, el) => {
    const href = $(el).attr('href');
    if (href?.includes('/works/')) {
      urls.push(`https://archiveofourown.org${href}`);
    }
  });

  return urls;
}
