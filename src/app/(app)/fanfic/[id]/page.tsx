import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ReaderView } from '@/components/reader/reader-view';
import type { Fanfic } from '@/types';

interface FanficPageProps {
  params: Promise<{ id: string }>;
}

export default async function FanficPage({ params }: FanficPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: fanfic } = await supabase
    .from('fanfics')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!fanfic) return notFound();

  return <ReaderView fanfic={fanfic as Fanfic} />;
}
