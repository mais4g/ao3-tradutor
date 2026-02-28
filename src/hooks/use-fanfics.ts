'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Fanfic } from '@/types';

async function loadFanfics(): Promise<Fanfic[]> {
  const res = await fetch('/api/fanfics?pageSize=50');
  if (!res.ok) return [];
  const data = await res.json();
  return data.fanfics ?? [];
}

export function useFanfics() {
  const [fanfics, setFanfics] = useState<Fanfic[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    const data = await loadFanfics();
    setFanfics(data);
    setLoading(false);
  }, []);

  // Initial load + real-time subscription
  useEffect(() => {
    // Fetch initial data via external async function (avoids set-state-in-effect)
    let cancelled = false;
    loadFanfics().then((data) => {
      if (!cancelled) {
        setFanfics(data);
        setLoading(false);
      }
    });

    // Subscribe to real-time changes
    const channel = supabase
      .channel('fanfics-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fanfics' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setFanfics((prev) => [payload.new as Fanfic, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setFanfics((prev) =>
              prev.map((f) =>
                f.id === (payload.new as Fanfic).id ? (payload.new as Fanfic) : f,
              ),
            );
          } else if (payload.eventType === 'DELETE') {
            setFanfics((prev) =>
              prev.filter((f) => f.id !== (payload.old as { id: string }).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function startTranslation(urls: string[], languageTo: string) {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls, languageTo }),
    });
    return res.json();
  }

  async function deleteFanfic(id: string) {
    const res = await fetch(`/api/fanfics/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFanfics((prev) => prev.filter((f) => f.id !== id));
    }
    return res.ok;
  }

  function downloadFanfic(id: string) {
    window.open(`/api/fanfics/${id}`, '_blank');
  }

  return {
    fanfics,
    loading,
    startTranslation,
    deleteFanfic,
    downloadFanfic,
    refresh,
  };
}
