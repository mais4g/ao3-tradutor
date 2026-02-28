import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? 'all';
  const sortBy = searchParams.get('sortBy') ?? 'created_at';
  const sortOrder = searchParams.get('sortOrder') ?? 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '12', 10)));

  const validSortColumns = ['created_at', 'updated_at', 'title_translated', 'author'];
  const column = validSortColumns.includes(sortBy) ? sortBy : 'created_at';

  let query = supabase
    .from('fanfics')
    .select('*', { count: 'exact' });

  // Status filter
  if (status && status !== 'all') {
    if (status === 'active') {
      query = query.in('status', ['pending', 'scraping', 'translating']);
    } else {
      query = query.eq('status', status);
    }
  }

  // Search filter
  if (search) {
    query = query.or(
      `title_original.ilike.%${search}%,title_translated.ilike.%${search}%,author.ilike.%${search}%`,
    );
  }

  // Sort + paginate
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: fanfics, error, count } = await query
    .order(column, { ascending: sortOrder === 'asc' })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    fanfics: fanfics ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}
