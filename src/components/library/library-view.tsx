'use client';

import { useFanfics } from '@/hooks/use-fanfics';
import { FanficList } from '@/components/fanfic-list';

export function LibraryView() {
  const { fanfics, loading, deleteFanfic, downloadFanfic } = useFanfics();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Biblioteca</h1>
        <p className="text-muted-foreground">
          Gerencie suas fanfics traduzidas.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : (
        <FanficList
          fanfics={fanfics}
          onDownload={downloadFanfic}
          onDelete={deleteFanfic}
        />
      )}
    </div>
  );
}
