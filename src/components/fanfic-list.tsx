'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FanficCard } from '@/components/fanfic-card';
import type { Fanfic, FanficStatus } from '@/types';

interface FanficListProps {
  fanfics: Fanfic[];
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

type FilterTab = 'all' | FanficStatus;

export function FanficList({ fanfics, onDownload, onDelete }: FanficListProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');

  const filtered = fanfics.filter((f) => {
    const matchesSearch =
      !search ||
      f.title_original?.toLowerCase().includes(search.toLowerCase()) ||
      f.title_translated?.toLowerCase().includes(search.toLowerCase()) ||
      f.author.toLowerCase().includes(search.toLowerCase());

    const matchesTab = tab === 'all' || f.status === tab;

    return matchesSearch && matchesTab;
  });

  const counts = {
    all: fanfics.length,
    translating: fanfics.filter((f) => f.status === 'translating' || f.status === 'scraping' || f.status === 'pending').length,
    completed: fanfics.filter((f) => f.status === 'completed').length,
    error: fanfics.filter((f) => f.status === 'error').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
            <TabsTrigger value="translating">
              Ativos ({counts.translating})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completos ({counts.completed})
            </TabsTrigger>
            {counts.error > 0 && (
              <TabsTrigger value="error">
                Erros ({counts.error})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        <Input
          placeholder="Buscar por título ou autor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {fanfics.length === 0
              ? 'Sua biblioteca está vazia. Cole links do AO3 acima para começar!'
              : 'Nenhuma fanfic encontrada com esses filtros.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((fanfic) => (
            <FanficCard
              key={fanfic.id}
              fanfic={fanfic}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
