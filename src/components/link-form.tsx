'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isAO3Url } from '@/lib/utils';
import { LANGUAGES } from '@/lib/constants';

interface LinkFormProps {
  onSubmit: (urls: string[], languageTo: string) => Promise<unknown>;
}

export function LinkForm({ onSubmit }: LinkFormProps) {
  const [links, setLinks] = useState('');
  const [languageTo, setLanguageTo] = useState('pt');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const urls = links
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      toast.error('Cole pelo menos um link do AO3.');
      return;
    }

    const invalid = urls.filter((u) => !isAO3Url(u));
    if (invalid.length > 0) {
      toast.error(`Links inválidos: ${invalid.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(urls, languageTo);
      setLinks('');
      toast.success(`${urls.length} tradução(ões) iniciada(s)!`);
    } catch {
      toast.error('Erro ao iniciar tradução.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="links">Links do AO3</Label>
        <Textarea
          id="links"
          placeholder={'https://archiveofourown.org/works/12345678\nhttps://archiveofourown.org/works/87654321'}
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Cole um link por linha. Suporta works individuais.
        </p>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <Label>Traduzir para</Label>
          <Select value={languageTo} onValueChange={setLanguageTo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading || !links.trim()}>
          {loading ? 'Iniciando...' : 'Traduzir'}
        </Button>
      </div>
    </form>
  );
}
