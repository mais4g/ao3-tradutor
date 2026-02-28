'use client';

import Link from 'next/link';
import { useFanfics } from '@/hooks/use-fanfics';
import { LinkForm } from '@/components/link-form';
import { FanficCard } from '@/components/fanfic-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Library,
  ArrowRight,
} from 'lucide-react';

export function DashboardView() {
  const { fanfics, loading, startTranslation, deleteFanfic, downloadFanfic } =
    useFanfics();

  const stats = {
    total: fanfics.length,
    active: fanfics.filter((f) => f.status === 'translating' || f.status === 'scraping').length,
    completed: fanfics.filter((f) => f.status === 'completed').length,
    errors: fanfics.filter((f) => f.status === 'error').length,
  };

  const activeFanfics = fanfics.filter(
    (f) => f.status === 'translating' || f.status === 'scraping' || f.status === 'pending',
  );

  const recentFanfics = fanfics
    .filter((f) => f.status === 'completed')
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em progresso
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Erros
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Translation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Nova Tradução</CardTitle>
          <CardDescription>
            Cole links do AO3 para iniciar a tradução automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinkForm onSubmit={startTranslation} />
        </CardContent>
      </Card>

      {/* Active Translations */}
      {activeFanfics.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Traduções Ativas</h2>
            <div className="grid gap-3">
              {activeFanfics.map((fanfic) => (
                <FanficCard
                  key={fanfic.id}
                  fanfic={fanfic}
                  onDownload={downloadFanfic}
                  onDelete={deleteFanfic}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Recent Completed */}
      {!loading && recentFanfics.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recentes</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/library">
                  <Library className="mr-2 h-4 w-4" />
                  Ver biblioteca
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3">
              {recentFanfics.map((fanfic) => (
                <FanficCard
                  key={fanfic.id}
                  fanfic={fanfic}
                  onDownload={downloadFanfic}
                  onDelete={deleteFanfic}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && fanfics.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-center">
              Sua biblioteca está vazia. Cole um link do AO3 acima para começar!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
