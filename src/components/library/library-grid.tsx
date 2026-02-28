'use client';

import Link from 'next/link';
import { BookOpenText, Download, ExternalLink, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';
import type { Fanfic } from '@/types';

interface LibraryGridProps {
  fanfics: Fanfic[];
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

export function LibraryGrid({ fanfics, onDownload, onDelete }: LibraryGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {fanfics.map((fanfic) => {
        const status = STATUS_CONFIG[fanfic.status] ?? STATUS_CONFIG.pending;
        const isActive = fanfic.status === 'translating' || fanfic.status === 'scraping';
        const isCompleted = fanfic.status === 'completed';

        return (
          <Card key={fanfic.id} className="flex flex-col transition-colors hover:bg-muted/30">
            <CardContent className="flex-1 pt-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
                {fanfic.word_count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {fanfic.word_count.toLocaleString('pt-BR')} palavras
                  </span>
                )}
              </div>

              <h3 className="font-medium leading-snug line-clamp-2 mb-1">
                {fanfic.title_translated || fanfic.title_original || 'Carregando...'}
              </h3>

              {fanfic.title_original && fanfic.title_translated && (
                <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                  {fanfic.title_original}
                </p>
              )}

              <p className="text-sm text-muted-foreground">
                por {fanfic.author}
              </p>

              {isActive && (
                <div className="mt-3 space-y-1">
                  <Progress value={fanfic.progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {fanfic.progress}% — {fanfic.translated_paragraphs}/{fanfic.total_paragraphs}
                  </p>
                </div>
              )}

              {fanfic.status === 'error' && fanfic.error_message && (
                <p className="mt-2 text-xs text-destructive line-clamp-2">
                  {fanfic.error_message}
                </p>
              )}
            </CardContent>

            <CardFooter className="border-t pt-3 pb-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDate(fanfic.created_at)}
              </span>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href={fanfic.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver no AO3</TooltipContent>
                </Tooltip>

                {isCompleted && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link href={`/fanfic/${fanfic.id}`}>
                            <BookOpenText className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ler</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onDownload(fanfic.id)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download EPUB</TooltipContent>
                    </Tooltip>
                  </>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(fanfic.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Deletar</TooltipContent>
                </Tooltip>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
