'use client';

/**
 * useRoutes hook
 * Fetches routes from /api/routes (ORS backend).
 * Passes coordinates if available (from Nominatim place selection).
 */

import { useState, useCallback, useRef } from 'react';
import type { SmartRouteOption, RoutePreferences, LatLng } from '@/lib/types';

interface UseRoutesState {
  routes:        SmartRouteOption[];
  selectedRoute: SmartRouteOption | null;
  isLoading:     boolean;
  error:         string | null;
}

interface UseRoutesActions {
  fetchRoutes: (
    origin:      string,
    destination: string,
    prefs:       RoutePreferences,
    originCoords?:     LatLng | null,
    destCoords?:       LatLng | null,
  ) => Promise<void>;
  selectRoute: (route: SmartRouteOption) => void;
  clearRoutes: () => void;
  restoreRoute: (route: SmartRouteOption) => void;
}

export function useRoutes(): UseRoutesState & UseRoutesActions {
  const [routes,        setRoutes]        = useState<SmartRouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SmartRouteOption | null>(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Simple cache: key → scored routes
  const cache = useRef<Map<string, SmartRouteOption[]>>(new Map());

  const fetchRoutes = useCallback(async (
    origin:       string,
    destination:  string,
    prefs:        RoutePreferences,
    originCoords: LatLng | null = null,
    destCoords:   LatLng | null = null,
  ) => {
    if (!origin || !destination) return;

    const cacheKey =
      `${originCoords?.lat},${originCoords?.lng}|${destCoords?.lat},${destCoords?.lng}|${JSON.stringify(prefs)}`;

    if (cache.current.has(cacheKey)) {
      const cached = cache.current.get(cacheKey)!;
      setRoutes(cached);
      setSelectedRoute(cached[0] ?? null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/routes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          origin,
          destination,
          originCoords,
          destinationCoords: destCoords,
          preferences: prefs,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.status === 'ZERO_RESULTS') {
        setRoutes([]);
        setSelectedRoute(null);
        setError('No routes found between these locations.');
        return;
      }

      if (data.error) throw new Error(data.error);

      const fetchedRoutes: SmartRouteOption[] = data.routes ?? [];

      // Cap cache at 20 entries
      if (cache.current.size >= 20) {
        const firstKey = cache.current.keys().next().value;
        if (firstKey) cache.current.delete(firstKey);
      }
      cache.current.set(cacheKey, fetchedRoutes);

      setRoutes(fetchedRoutes);
      setSelectedRoute(fetchedRoutes[0] ?? null);
    } catch (err: any) {
      console.error('useRoutes error:', err);
      setError(err.message || 'Failed to fetch routes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectRoute = useCallback((route: SmartRouteOption) => setSelectedRoute(route), []);
  const clearRoutes  = useCallback(() => {
    setRoutes([]);
    setSelectedRoute(null);
    setError(null);
  }, []);
  const restoreRoute = useCallback((route: SmartRouteOption) => {
    setRoutes([route]);
    setSelectedRoute(route);
    setError(null);
  }, []);

  return { routes, selectedRoute, isLoading, error, fetchRoutes, selectRoute, clearRoutes, restoreRoute };
}
