'use client';

/**
 * Main application page.
 * Updated for ORS + Nominatim stack — no Google Maps dependency.
 *
 * Coords are embedded in Nominatim place results, so no extra geocoding
 * API call is needed when the user picks from autocomplete.
 */

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar/Sidebar';
import type { SmartRouteOption, PlaceResult, LatLng, RoutePreferences } from '@/lib/types';
import { useRoutes }      from '@/hooks/useRoutes';
import { usePreferences } from '@/hooks/usePreferences';
import { useAuth }        from '@/hooks/useAuth';
import { useTheme }       from 'next-themes';

type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'needs-auth';

// Dynamically import MapView (Leaflet must not SSR)
const MapView = dynamic(() => import('@/components/Map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface-secondary">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/15 flex items-center justify-center mx-auto mb-3 animate-pulse">
          <span className="text-3xl">🗺</span>
        </div>
        <p className="text-white/40 text-sm">Loading map…</p>
      </div>
    </div>
  ),
});

// ─── Geocode fallback (when user types manually without autocomplete) ─────────

async function geocodeFallback(address: string): Promise<LatLng | null> {
  try {
    const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    const data = await res.json();
    return data.coords ?? null;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';

  // ── Auth ─────────────────────────────────────────────────────────────────
  const { user } = useAuth();

  // ── Route state ──────────────────────────────────────────────────────────
  const {
    routes, selectedRoute, isLoading, error,
    fetchRoutes, selectRoute, clearRoutes, restoreRoute,
  } = useRoutes();

  // ── Preferences ──────────────────────────────────────────────────────────
  const { preferences, updatePreference } = usePreferences();

  // ── Save state ───────────────────────────────────────────────────────────
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // ── Search state ─────────────────────────────────────────────────────────
  const [origin,       setOrigin]       = useState('');
  const [destination,  setDestination]  = useState('');
  const [originCoords, setOriginCoords] = useState<LatLng | null>(null);
  const [destCoords,   setDestCoords]   = useState<LatLng | null>(null);

  // ── Handle place selection (Nominatim embeds coords) ─────────────────────
  const handleOriginSelect = useCallback(async (place: PlaceResult) => {
    setOrigin(place.description);
    // Nominatim always returns coords — use them directly
    if (place.coords) {
      setOriginCoords(place.coords);
    } else {
      const resolved = await geocodeFallback(place.description);
      setOriginCoords(resolved);
    }
  }, []);

  const handleDestSelect = useCallback(async (place: PlaceResult) => {
    setDestination(place.description);
    if (place.coords) {
      setDestCoords(place.coords);
    } else {
      const resolved = await geocodeFallback(place.description);
      setDestCoords(resolved);
    }
  }, []);

  // ── Swap ──────────────────────────────────────────────────────────────────
  const handleSwapLocations = useCallback(() => {
    setOrigin(destination);
    setDestination(origin);
    setOriginCoords(destCoords);
    setDestCoords(originCoords);
    clearRoutes();
  }, [origin, destination, originCoords, destCoords, clearRoutes]);

  // ── Restore saved route ───────────────────────────────────────────────────
  const handleRestoreRoute = useCallback((savedRoute: any) => {
    setOrigin(savedRoute.origin);
    setDestination(savedRoute.destination);
    setOriginCoords(savedRoute.origin_coords);
    setDestCoords(savedRoute.destination_coords);
    restoreRoute(savedRoute.route_data);
  }, [restoreRoute]);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!origin || !destination) return;

    // Geocode only if coords are missing (manual typing without autocomplete)
    let oCoords = originCoords;
    let dCoords = destCoords;
    if (!oCoords) oCoords = await geocodeFallback(origin);
    if (!dCoords) dCoords = await geocodeFallback(destination);

    await fetchRoutes(origin, destination, preferences, oCoords, dCoords);
  }, [origin, destination, originCoords, destCoords, preferences, fetchRoutes]);

  // ── Save route ────────────────────────────────────────────────────────────
  const handleSaveRoute = useCallback(async (route: SmartRouteOption) => {
    // Guard: must be signed in
    if (!user) {
      setSaveState('needs-auth');
      setTimeout(() => setSaveState('idle'), 3000);
      return;
    }

    setSaveState('saving');
    try {
      const res = await fetch('/api/saved-routes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          origin,
          destination,
          originCoords,
          destinationCoords: destCoords,
          routeData:   route,
          preferences,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (err: any) {
      console.error('Save route failed:', err);
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 4000);
    }
  }, [user, origin, destination, originCoords, destCoords, preferences]);

  // ── Re-fetch when preferences change ──────────────────────────────────────
  useEffect(() => {
    if (routes.length > 0 && origin && destination) {
      fetchRoutes(origin, destination, preferences, originCoords, destCoords);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences]);

  return (
    <main className="app-layout" aria-label="SmartRoute application">
      {/* ── Left Sidebar ──────────────────────────────────────────────── */}
      <aside className="sidebar" aria-label="Navigation controls">
        <Sidebar
          origin={origin}
          destination={destination}
          onOriginChange={(v) => { setOrigin(v); if (!v) setOriginCoords(null); }}
          onDestinationChange={(v) => { setDestination(v); if (!v) setDestCoords(null); }}
          onOriginSelect={handleOriginSelect}
          onDestinationSelect={handleDestSelect}
          onSwapLocations={handleSwapLocations}
          routes={routes}
          selectedRoute={selectedRoute}
          isLoading={isLoading}
          error={error}
          onRouteSelect={selectRoute}
          onSaveRoute={handleSaveRoute}
          onRestoreRoute={handleRestoreRoute}
          saveState={saveState}
          onSearch={handleSearch}
          onRetry={handleSearch}
          preferences={preferences}
          onPreferenceUpdate={updatePreference}
        />
      </aside>

      {/* ── Right Map Panel ─────────────────────────────────────────────── */}
      <section className="map-panel" aria-label="Map view">
        <MapView
          routes={routes}
          selectedRoute={selectedRoute}
          originCoords={originCoords}
          destCoords={destCoords}
          originLabel={origin}
          destLabel={destination}
          onRouteClick={selectRoute}
          isDarkMode={isDarkMode}
        />

        {/* Route count badge */}
        {routes.length > 0 && (
          <div className="absolute top-4 right-14 px-3 py-2 rounded-xl bg-surface/80 backdrop-blur-md border border-white/10 text-xs text-white/70 animate-fade-in z-[1000]">
            <span className="font-semibold text-brand-300">{routes.length}</span> routes · Click to select
          </div>
        )}

        {/* Save route toast */}
        {saveState !== 'idle' && (
          <div
            className={`absolute bottom-14 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl backdrop-blur-md border text-xs font-medium animate-fade-in z-[1200] flex items-center gap-2 ${
              saveState === 'saving'     ? 'bg-surface/90 border-white/10 text-white/60' :
              saveState === 'saved'      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
              saveState === 'needs-auth' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
                                          'bg-red-500/20 border-red-500/30 text-red-300'
            }`}
          >
            {saveState === 'saving'     && <><span className="animate-spin">⏳</span> Saving route…</>}
            {saveState === 'saved'      && <>✓ Route saved!</>}
            {saveState === 'needs-auth' && <>⚠ Sign in to save routes</>}
            {saveState === 'error'      && <>✕ Failed to save — try again</>}
          </div>
        )}

        {/* OSM attribution note */}
        <div className="absolute bottom-6 left-4 text-[10px] text-white/20 z-[500] pointer-events-none">
          Map: © OpenStreetMap contributors · Routes: OpenRouteService
        </div>
      </section>
    </main>
  );
}
