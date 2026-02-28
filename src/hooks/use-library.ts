'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Fanfic, LibraryFilters } from '@/types';

interface LibraryData {
  fanfics: Fanfic[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const EMPTY_DATA: LibraryData = {
  fanfics: [],
  total: 0,
  page: 1,
  pageSize: 12,
  totalPages: 0,
};

function filtersToParams(filters: LibraryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.sortBy && filters.sortBy !== 'created_at') params.set('sortBy', filters.sortBy);
  if (filters.sortOrder && filters.sortOrder !== 'desc') params.set('sortOrder', filters.sortOrder);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.pageSize && filters.pageSize !== 12) params.set('pageSize', String(filters.pageSize));
  return params;
}

async function fetchFromApi(params: URLSearchParams): Promise<LibraryData> {
  const apiParams = new URLSearchParams(params.toString());
  if (!apiParams.has('page')) apiParams.set('page', '1');
  if (!apiParams.has('pageSize')) apiParams.set('pageSize', '12');

  const res = await fetch(`/api/fanfics?${apiParams.toString()}`);
  if (!res.ok) return EMPTY_DATA;
  return res.json();
}

export function useLibrary() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  const [data, setData] = useState<LibraryData>(EMPTY_DATA);
  // Track which paramsKey was last fetched, to derive loading state
  const [fetchedKey, setFetchedKey] = useState<string | null>(null);

  // Loading = we haven't fetched for the current params yet
  const loading = fetchedKey !== paramsKey;

  // Read filters from URL (memoized)
  const filters = useMemo<LibraryFilters>(() => ({
    search: searchParams.get('search') ?? '',
    status: (searchParams.get('status') as LibraryFilters['status']) ?? 'all',
    sortBy: (searchParams.get('sortBy') as LibraryFilters['sortBy']) ?? 'created_at',
    sortOrder: (searchParams.get('sortOrder') as LibraryFilters['sortOrder']) ?? 'desc',
    page: parseInt(searchParams.get('page') ?? '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') ?? '12', 10),
  }), [searchParams]);

  // Fetch when params change — setState only happens in async callbacks
  useEffect(() => {
    let cancelled = false;
    fetchFromApi(searchParams).then((result) => {
      if (!cancelled) {
        setData(result);
        setFetchedKey(paramsKey);
      }
    });
    return () => { cancelled = true; };
  }, [searchParams, paramsKey]);

  // Update URL with new filters
  const setFilters = useCallback(
    (updates: Partial<LibraryFilters>) => {
      const merged = { ...filters, ...updates };
      if ('search' in updates || 'status' in updates || 'sortBy' in updates || 'sortOrder' in updates) {
        merged.page = 1;
      }
      const params = filtersToParams(merged);
      router.push(`/library?${params.toString()}`, { scroll: false });
    },
    [filters, router],
  );

  const setPage = useCallback(
    (page: number) => {
      const merged = { ...filters, page };
      const params = filtersToParams(merged);
      router.push(`/library?${params.toString()}`, { scroll: false });
    },
    [filters, router],
  );

  async function deleteFanfic(id: string) {
    const res = await fetch(`/api/fanfics/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setData((prev) => ({
        ...prev,
        fanfics: prev.fanfics.filter((f) => f.id !== id),
        total: prev.total - 1,
      }));
    }
    return res.ok;
  }

  function downloadFanfic(id: string) {
    window.open(`/api/fanfics/${id}`, '_blank');
  }

  return {
    fanfics: data.fanfics,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    totalPages: data.totalPages,
    loading,
    filters,
    setFilters,
    setPage,
    deleteFanfic,
    downloadFanfic,
  };
}
