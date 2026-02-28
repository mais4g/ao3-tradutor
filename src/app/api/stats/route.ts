import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data: fanfics } = await supabase
    .from('fanfics')
    .select('status, total_paragraphs, translated_paragraphs, word_count')
    .eq('user_id', user.id);

  if (!fanfics) {
    return NextResponse.json({
      totalFanfics: 0,
      completed: 0,
      inProgress: 0,
      errors: 0,
      totalParagraphs: 0,
      translatedParagraphs: 0,
      totalWordCount: 0,
    });
  }

  const stats = {
    totalFanfics: fanfics.length,
    completed: fanfics.filter((f) => f.status === 'completed').length,
    inProgress: fanfics.filter((f) => f.status === 'translating' || f.status === 'scraping').length,
    errors: fanfics.filter((f) => f.status === 'error').length,
    totalParagraphs: fanfics.reduce((sum, f) => sum + (f.total_paragraphs || 0), 0),
    translatedParagraphs: fanfics.reduce((sum, f) => sum + (f.translated_paragraphs || 0), 0),
    totalWordCount: fanfics.reduce((sum, f) => sum + (f.word_count || 0), 0),
  };

  return NextResponse.json(stats);
}
