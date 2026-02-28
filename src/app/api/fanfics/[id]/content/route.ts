import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Fetch fanfic (RLS ensures ownership)
  const { data: fanfic } = await supabase
    .from('fanfics')
    .select('content_path, status')
    .eq('id', id)
    .single();

  if (!fanfic) {
    return NextResponse.json({ error: 'Fanfic não encontrada' }, { status: 404 });
  }

  if (!fanfic.content_path) {
    return NextResponse.json(
      { error: 'Conteúdo não disponível para leitura online' },
      { status: 404 },
    );
  }

  // Download content JSON from storage
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from('epubs')
    .download(fanfic.content_path);

  if (error || !data) {
    return NextResponse.json(
      { error: 'Erro ao carregar conteúdo' },
      { status: 500 },
    );
  }

  const text = await data.text();
  const content = JSON.parse(text);

  return NextResponse.json(content);
}
