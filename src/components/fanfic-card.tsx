'use client';

import Link from 'next/link';
import { BookOpenText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/utils';
import type { Fanfic } from '@/types';

interface FanficCardProps {
  fanfic: Fanfic;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  scraping: { label: 'Extraindo', variant: 'outline' },
  translating: { label: 'Traduzindo', variant: 'default' },
  completed: { label: 'Completo', variant: 'secondary' },
  error: { label: 'Erro', variant: 'destructive' },
};

export function FanficCard({ fanfic, onDownload, onDelete }: FanficCardProps) {
  const status = STATUS_CONFIG[fanfic.status] ?? STATUS_CONFIG.pending;
  const isActive = fanfic.status === 'translating' || fanfic.status === 'scraping';
  const isCompleted = fanfic.status === 'completed';

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">
            {fanfic.title_translated || fanfic.title_original || 'Carregando...'}
          </h3>
          {fanfic.title_original && fanfic.title_translated && (
            <p className="truncate text-sm text-muted-foreground">
              {fanfic.title_original}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            por {fanfic.author}
          </p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {isActive && (
        <div className="space-y-1">
          <Progress value={fanfic.progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {fanfic.translated_paragraphs}/{fanfic.total_paragraphs} parágrafos
            ({fanfic.progress}%)
          </p>
        </div>
      )}

      {fanfic.status === 'error' && fanfic.error_message && (
        <p className="text-sm text-destructive">{fanfic.error_message}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatDate(fanfic.created_at)}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <a
              href={fanfic.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              AO3
            </a>
          </Button>
          {isCompleted && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/fanfic/${fanfic.id}`}>
                  <BookOpenText className="mr-1 h-3 w-3" />
                  Ler
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(fanfic.id)}
              >
                Download
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(fanfic.id)}
          >
            Deletar
          </Button>
        </div>
      </div>
    </div>
  );
}
