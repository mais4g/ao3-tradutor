'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LibraryFilters } from '@/types';

interface LibraryFiltersBarProps {
  filters: LibraryFilters;
  onFiltersChange: (updates: Partial<LibraryFilters>) => void;
  counts?: { all: number; active: number; completed: number; error: number };
}

export function LibraryFiltersBar({ filters, onFiltersChange, counts }: LibraryFiltersBarProps) {
  const statusValue = filters.status ?? 'all';
  const sortValue = `${filters.sortBy ?? 'created_at'}_${filters.sortOrder ?? 'desc'}`;

  function handleSortChange(value: string) {
    const [sortBy, sortOrder] = value.split('_') as [LibraryFilters['sortBy'], LibraryFilters['sortOrder']];
    onFiltersChange({ sortBy, sortOrder });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={statusValue} onValueChange={(v) => onFiltersChange({ status: v as LibraryFilters['status'] })}>
          <TabsList>
            <TabsTrigger value="all">
              Todos{counts ? ` (${counts.all})` : ''}
            </TabsTrigger>
            <TabsTrigger value="active">
              Ativos{counts ? ` (${counts.active})` : ''}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completos{counts ? ` (${counts.completed})` : ''}
            </TabsTrigger>
            <TabsTrigger value="error">
              Erros{counts ? ` (${counts.error})` : ''}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <Select value={sortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at_desc">Mais recentes</SelectItem>
              <SelectItem value="created_at_asc">Mais antigos</SelectItem>
              <SelectItem value="title_translated_asc">Título A-Z</SelectItem>
              <SelectItem value="title_translated_desc">Título Z-A</SelectItem>
              <SelectItem value="author_asc">Autor A-Z</SelectItem>
              <SelectItem value="updated_at_desc">Última atualização</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou autor..."
          value={filters.search ?? ''}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="pl-10"
        />
      </div>
    </div>
  );
}
