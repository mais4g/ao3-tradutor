'use client';

import { Suspense } from 'react';
import { Library, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useLibrary } from '@/hooks/use-library';
import { LibraryFiltersBar } from '@/components/library/library-filters';
import { LibraryGrid } from '@/components/library/library-grid';
import { FanficCard } from '@/components/fanfic-card';
import { LibraryPagination } from '@/components/library/library-pagination';
import { useLocalStorage } from '@/hooks/use-local-storage';

type ViewMode = 'grid' | 'list';

function LibraryContent() {
  const {
    fanfics,
    total,
    page,
    totalPages,
    loading,
    filters,
    setFilters,
    setPage,
    deleteFanfic,
    downloadFanfic,
  } = useLibrary();

  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('library-view-mode', 'grid');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Biblioteca</h1>
          <p className="text-muted-foreground">
            {total > 0
              ? `${total} fanfic${total !== 1 ? 's' : ''} na sua biblioteca.`
              : 'Gerencie suas fanfics traduzidas.'}
          </p>
        </div>
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grade</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Lista</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <LibraryFiltersBar filters={filters} onFiltersChange={setFilters} />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : fanfics.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Library className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {total === 0 && !filters.search && (!filters.status || filters.status === 'all')
              ? 'Sua biblioteca está vazia. Vá ao Dashboard para traduzir fanfics!'
              : 'Nenhuma fanfic encontrada com esses filtros.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <LibraryGrid
          fanfics={fanfics}
          onDownload={downloadFanfic}
          onDelete={deleteFanfic}
        />
      ) : (
        <div className="grid gap-3">
          {fanfics.map((fanfic) => (
            <FanficCard
              key={fanfic.id}
              fanfic={fanfic}
              onDownload={downloadFanfic}
              onDelete={deleteFanfic}
            />
          ))}
        </div>
      )}

      <LibraryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export function LibraryView() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    }>
      <LibraryContent />
    </Suspense>
  );
}
