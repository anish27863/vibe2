'use client';

/**
 * usePlacesAutocomplete hook
 * Fetches place suggestions from our secure /api/places proxy.
 */

import { useState, useCallback, useRef } from 'react';
import type { PlaceResult } from '@/lib/types';

export function usePlacesAutocomplete() {
  const [predictions, setPredictions] = useState<PlaceResult[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [sessionToken] = useState(() => crypto.randomUUID()); // session grouping for billing
  const debounceTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPredictions = useCallback((input: string) => {
    // Debounce: wait 300ms after user stops typing
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!input || input.length < 2) {
      setPredictions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ input, sessionToken });
        const res = await fetch(`/api/places?${params.toString()}`);
        const data = await res.json();
        setPredictions(data.predictions ?? []);
      } catch {
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [sessionToken]);

  const clearPredictions = useCallback(() => setPredictions([]), []);

  return { predictions, isLoading, fetchPredictions, clearPredictions };
}
