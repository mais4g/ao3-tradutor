import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { scrapeWork } from '@/lib/scraper';
import { getTranslator } from '@/lib/translator';
import { generateEpub } from '@/lib/epub';
import { extractWorkId, isAO3Url } from '@/lib/utils';
import type { TranslateRequest } from '@/types';

const BATCH_SIZE = 30;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  let body: TranslateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { urls, languageTo = 'pt' } = body;

  if (!urls?.length) {
    return NextResponse.json({ error: 'Nenhuma URL fornecida' }, { status: 400 });
  }

  const invalidUrls = urls.filter((u) => !isAO3Url(u));
  if (invalidUrls.length > 0) {
    return NextResponse.json(
      { error: `URLs inválidas: ${invalidUrls.join(', ')}` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const results: { url: string; fanficId?: string; error?: string }[] = [];

  for (const url of urls) {
    const workId = extractWorkId(url);
    if (!workId) {
      results.push({ url, error: 'Work ID não encontrado' });
      continue;
    }

    // Check for duplicates
    const { data: existing } = await admin
      .from('fanfics')
      .select('id')
      .eq('user_id', user.id)
      .eq('work_id', workId)
      .single();

    if (existing) {
      results.push({ url, fanficId: existing.id, error: 'Já existe na biblioteca' });
      continue;
    }

    // Create pending record
    const { data: fanfic, error: insertError } = await admin
      .from('fanfics')
      .insert({
        user_id: user.id,
        work_id: workId,
        url,
        language_to: languageTo,
        status: 'scraping',
      })
      .select('id')
      .single();

    if (insertError || !fanfic) {
      results.push({ url, error: insertError?.message ?? 'Erro ao criar registro' });
      continue;
    }

    results.push({ url, fanficId: fanfic.id });

    // Start translation in background (fire & forget)
    processTranslation(fanfic.id, url, languageTo, user.id).catch(() => {});
  }

  return NextResponse.json({ results });
}

async function processTranslation(
  fanficId: string,
  url: string,
  languageTo: string,
  userId: string,
) {
  const admin = createAdminClient();

  try {
    // 1. Scrape
    const scraped = await scrapeWork(url);

    await admin
      .from('fanfics')
      .update({
        title_original: scraped.title,
        author: scraped.author,
        language_from: scraped.languageFrom,
        total_paragraphs: scraped.paragraphs.length,
        status: 'translating',
      })
      .eq('id', fanficId);

    // 2. Save paragraphs to storage for chunked processing
    const paragraphsJson = JSON.stringify(scraped.paragraphs);
    await admin.storage
      .from('epubs')
      .upload(`${userId}/${fanficId}_paragraphs.json`, paragraphsJson, {
        contentType: 'application/json',
        upsert: true,
      });

    // 3. Translate in batches
    const translator = getTranslator();
    const translated: string[] = [];

    for (let i = 0; i < scraped.paragraphs.length; i += BATCH_SIZE) {
      const batch = scraped.paragraphs.slice(i, i + BATCH_SIZE);
      const batchTranslated = await translator.translateBatch(
        batch,
        scraped.languageFrom,
        languageTo,
      );
      translated.push(...batchTranslated);

      // Update progress
      const progress = Math.round((translated.length / scraped.paragraphs.length) * 100);
      await admin
        .from('fanfics')
        .update({
          translated_paragraphs: translated.length,
          progress,
        })
        .eq('id', fanficId);
    }

    // 4. Translate title
    const titleTranslated = await translator.translate(
      scraped.title,
      scraped.languageFrom,
      languageTo,
    );

    // 5. Generate EPUB
    const epubBuffer = await generateEpub({
      title: titleTranslated,
      titleOriginal: scraped.title,
      author: scraped.author,
      sourceUrl: scraped.url,
      chapters: [
        {
          title: titleTranslated,
          content: translated.join('\n'),
        },
      ],
    });

    // 6. Upload EPUB to storage
    const epubPath = `${userId}/${fanficId}.epub`;

    await admin.storage
      .from('epubs')
      .upload(epubPath, epubBuffer, {
        contentType: 'application/epub+zip',
        upsert: true,
      });

    // 7. Clean up temp paragraphs file
    await admin.storage
      .from('epubs')
      .remove([`${userId}/${fanficId}_paragraphs.json`]);

    // 8. Mark as completed
    await admin
      .from('fanfics')
      .update({
        title_translated: titleTranslated,
        epub_path: epubPath,
        status: 'completed',
        progress: 100,
        translated_paragraphs: scraped.paragraphs.length,
      })
      .eq('id', fanficId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    await admin
      .from('fanfics')
      .update({
        status: 'error',
        error_message: message,
      })
      .eq('id', fanficId);
  }
}
