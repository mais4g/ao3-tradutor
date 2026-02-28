'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Fanfic, FanficContent } from '@/types';
import { STATUS_LABELS } from '@/lib/constants';

interface ReaderViewProps {
  fanfic: Fanfic;
}

export function ReaderView({ fanfic }: ReaderViewProps) {
  const canLoad = fanfic.status === 'completed' && !!fanfic.content_path;
  const [content, setContent] = useState<FanficContent | null>(null);
  const [loading, setLoading] = useState(canLoad);

  useEffect(() => {
    if (!canLoad) return;

    let cancelled = false;
    fetch(`/api/fanfics/${fanfic.id}/content`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setContent(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [fanfic.id, canLoad]);

  const title = fanfic.title_translated || fanfic.title_original || 'Sem título';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/library">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{title}</h1>
          {fanfic.title_original && fanfic.title_translated && (
            <p className="text-sm text-muted-foreground truncate">
              {fanfic.title_original}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            por {fanfic.author}
          </p>
        </div>
        <Badge variant={fanfic.status === 'completed' ? 'secondary' : 'outline'}>
          {STATUS_LABELS[fanfic.status] || fanfic.status}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {fanfic.status === 'completed' && fanfic.epub_path && (
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/fanfics/${fanfic.id}`} download>
              <Download className="mr-2 h-4 w-4" />
              Download EPUB
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <a href={fanfic.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver no AO3
          </a>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : content ? (
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {content.chapters.map((chapter, i) => (
            <section key={i}>
              {content.chapters.length > 1 && (
                <h2>{chapter.title}</h2>
              )}
              <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
            </section>
          ))}
        </article>
      ) : fanfic.status === 'completed' ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            Conteúdo não disponível para leitura online.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Faça o download do EPUB para ler esta fanfic.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            Esta fanfic ainda está sendo processada.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Status: {STATUS_LABELS[fanfic.status] || fanfic.status}
          </p>
        </div>
      )}
    </div>
  );
}
