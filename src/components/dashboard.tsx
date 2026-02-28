'use client';

import { useFanfics } from '@/hooks/use-fanfics';
import { Header } from '@/components/header';
import { LinkForm } from '@/components/link-form';
import { FanficList } from '@/components/fanfic-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface DashboardProps {
  userEmail: string;
}

export function Dashboard({ userEmail }: DashboardProps) {
  const { fanfics, loading, startTranslation, deleteFanfic, downloadFanfic } = useFanfics();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header userEmail={userEmail} />

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-6">
        {/* Translation form */}
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
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Biblioteca</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <FanficList
              fanfics={fanfics}
              onDownload={downloadFanfic}
              onDelete={deleteFanfic}
            />
          )}
        </div>
      </main>
    </div>
  );
}
