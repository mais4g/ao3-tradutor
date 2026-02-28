import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Get fanfic record (RLS ensures user owns it)
  const { data: fanfic, error } = await supabase
    .from('fanfics')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !fanfic) {
    return NextResponse.json({ error: 'Fanfic não encontrada' }, { status: 404 });
  }

  if (!fanfic.epub_path) {
    return NextResponse.json({ error: 'EPUB ainda não disponível' }, { status: 404 });
  }

  // Download from storage using admin (storage RLS can be tricky)
  const admin = createAdminClient();
  const { data: fileData, error: downloadError } = await admin.storage
    .from('epubs')
    .download(fanfic.epub_path);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: 'Erro ao baixar EPUB' }, { status: 500 });
  }

  const filename = fanfic.title_translated
    ? `${fanfic.title_translated} - ${fanfic.author}.epub`
    : `${fanfic.work_id}.epub`;

  const buffer = Buffer.from(await fileData.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/epub+zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Get fanfic (RLS ensures ownership)
  const { data: fanfic } = await supabase
    .from('fanfics')
    .select('epub_path')
    .eq('id', id)
    .single();

  // Delete EPUB from storage
  if (fanfic?.epub_path) {
    const admin = createAdminClient();
    await admin.storage.from('epubs').remove([fanfic.epub_path]);
    // Also remove temp paragraphs if they exist
    await admin.storage.from('epubs').remove([
      `${user.id}/${id}_paragraphs.json`,
    ]);
  }

  // Delete record
  const { error } = await supabase
    .from('fanfics')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
