'use client';

import { useFanfics } from '@/hooks/use-fanfics';
import { LinkForm } from '@/components/link-form';
import { FanficList } from '@/components/fanfic-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export function DashboardView() {
  const { fanfics, loading, startTranslation, deleteFanfic, downloadFanfic } =
    useFanfics();

  const stats = {
    total: fanfics.length,
    active: fanfics.filter((f) => f.status === 'translating' || f.status === 'scraping').length,
    completed: fanfics.filter((f) => f.status === 'completed').length,
    errors: fanfics.filter((f) => f.status === 'error').length,
  };

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
        </CardHeader>
        <CardContent>
          <LinkForm onSubmit={startTranslation} />
        </CardContent>
      </Card>

      <Separator />

      {/* Library */}
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
