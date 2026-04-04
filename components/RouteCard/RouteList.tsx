'use client';

/**
 * RouteList component
 * Renders all scored routes with header, sort capabilities, and empty/loading states.
 */

import React from 'react';
import { Route, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import RouteCard from './RouteCard';
import type { SmartRouteOption } from '@/lib/types';

interface RouteListProps {
  routes:        SmartRouteOption[];
  selectedRoute: SmartRouteOption | null;
  isLoading:     boolean;
  error:         string | null;
  onRouteSelect: (route: SmartRouteOption) => void;
  onSaveRoute:   (route: SmartRouteOption) => void;
  onRetry?:      () => void;
}

export default function RouteList({
  routes,
  selectedRoute,
  isLoading,
  error,
  onRouteSelect,
  onSaveRoute,
  onRetry,
}: RouteListProps) {
  // ── Loading State ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-brand-500/30 animate-pulse" />
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin absolute top-3 left-3" />
        </div>
        <div className="text-center">
          <p className="text-white/70 text-sm font-medium">Finding best routes…</p>
          <p className="text-white/30 text-xs mt-1">Analysing traffic & road types</p>
        </div>
        {/* Skeleton cards */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-full h-24 rounded-xl bg-white/4 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <p className="text-white/80 text-sm font-medium">Route search failed</p>
          <p className="text-white/40 text-xs mt-1 max-w-xs">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        )}
      </div>
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────
  if (routes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center opacity-60">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
          <Route className="w-8 h-8 text-brand-400/60" />
        </div>
        <div>
          <p className="text-white/60 text-sm font-medium">No routes yet</p>
          <p className="text-white/30 text-xs mt-1">Enter a start & end location to get started</p>
        </div>
      </div>
    );
  }

  // ── Routes List ────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          {routes.length} Route{routes.length !== 1 ? 's' : ''} Found
        </h3>
        <span className="text-xs text-white/30">Ranked by SmartScore</span>
      </div>

      {/* Route cards */}
      {routes.map((route, idx) => (
        <RouteCard
          key={route.id}
          route={route}
          rank={idx}
          isSelected={selectedRoute?.id === route.id}
          onSelect={onRouteSelect}
          onSave={onSaveRoute}
        />
      ))}
    </div>
  );
}
