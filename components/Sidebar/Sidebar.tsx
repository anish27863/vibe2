'use client';

/**
 * Sidebar component
 * Left panel containing: header, search boxes, preferences, and route list.
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin, Navigation2, ArrowLeftRight, Search,
  LogIn, LogOut, User, BookmarkCheck, History, ChevronRight,
  Sparkles
} from 'lucide-react';
import SearchBox from '@/components/SearchBox/SearchBox';
import PreferencesPanel from '@/components/Preferences/PreferencesPanel';
import RouteList from '@/components/RouteCard/RouteList';
import ThemeToggle from '@/components/UI/ThemeToggle';
import AuthModal from '@/components/Auth/AuthModal';
import type { SmartRouteOption, RoutePreferences, PlaceResult } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  // Search
  origin:      string;
  destination: string;
  onOriginChange:      (v: string) => void;
  onDestinationChange: (v: string) => void;
  onOriginSelect:      (place: PlaceResult) => void;
  onDestinationSelect: (place: PlaceResult) => void;
  onSwapLocations: () => void;

  // Routes
  routes:        SmartRouteOption[];
  selectedRoute: SmartRouteOption | null;
  isLoading:     boolean;
  error:         string | null;
  onRouteSelect: (route: SmartRouteOption) => void;
  onSaveRoute:   (route: SmartRouteOption) => void;
  onSearch:      () => void;
  onRetry?:      () => void;

  // Preferences
  preferences: RoutePreferences;
  onPreferenceUpdate: <K extends keyof RoutePreferences>(key: K, value: RoutePreferences[K]) => void;
}

export default function Sidebar({
  origin, destination,
  onOriginChange, onDestinationChange,
  onOriginSelect, onDestinationSelect,
  onSwapLocations,
  routes, selectedRoute, isLoading, error,
  onRouteSelect, onSaveRoute, onSearch, onRetry,
  preferences, onPreferenceUpdate,
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const [authOpen,    setAuthOpen]    = useState(false);
  const [prefsOpen,   setPrefsOpen]   = useState(false);
  const [activeTab,   setActiveTab]   = useState<'routes' | 'saved' | 'history'>('routes');

  const canSearch = origin.trim().length >= 3 && destination.trim().length >= 3;

  // Coords are embedded in Nominatim PlaceResult — pass directly
  const handleOriginSelect = useCallback(
    (place: PlaceResult) => onOriginSelect(place),
    [onOriginSelect]
  );
  const handleDestSelect = useCallback(
    (place: PlaceResult) => onDestinationSelect(place),
    [onDestinationSelect]
  );

  return (
    <>
      <div className="flex flex-col h-full w-full bg-surface/95 backdrop-blur-xl border-r border-white/8 overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="px-4 py-4 border-b border-white/8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">SmartRoute</h1>
              <p className="text-[10px] text-white/30 leading-none mt-0.5">Intelligent Navigation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-brand-300" />
                </div>
                <button
                  onClick={signOut}
                  title="Sign out"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8 text-white/30 hover:text-white/70 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 text-xs font-medium transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* ── Search Section ───────────────────────────────────────────── */}
        <div className="px-4 py-4 space-y-2 shrink-0">
          {/* Origin */}
          <SearchBox
            value={origin}
            onChange={onOriginChange}
            onSelect={handleOriginSelect}
            placeholder="Starting point"
            type="origin"
          />

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={onSwapLocations}
              className="w-8 h-5 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/8 text-white/30 hover:text-white/60 transition-all"
              title="Swap locations"
            >
              <ArrowLeftRight className="w-3 h-3" />
            </button>
          </div>

          {/* Destination */}
          <SearchBox
            value={destination}
            onChange={onDestinationChange}
            onSelect={handleDestSelect}
            placeholder="Where to?"
            type="destination"
          />

          {/* Search button */}
          <button
            onClick={onSearch}
            disabled={!canSearch || isLoading}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-150',
              canSearch && !isLoading
                ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-glow hover:shadow-glow-lg'
                : 'bg-white/5 text-white/25 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <span className="animate-spin text-lg">⏳</span>
                Finding routes…
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Find Smart Routes
              </>
            )}
          </button>
        </div>

        {/* ── Preferences panel ────────────────────────────────────────── */}
        <div className="px-4 mb-3 shrink-0">
          <PreferencesPanel
            preferences={preferences}
            onUpdate={onPreferenceUpdate}
            isOpen={prefsOpen}
            onToggle={() => setPrefsOpen(!prefsOpen)}
          />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        {user && (
          <div className="px-4 mb-2 shrink-0">
            <div className="flex rounded-lg bg-white/4 p-0.5">
              {[
                { key: 'routes',  label: 'Routes',  icon: <Navigation2 className="w-3 h-3" /> },
                { key: 'saved',   label: 'Saved',   icon: <BookmarkCheck className="w-3 h-3" /> },
                { key: 'history', label: 'History',  icon: <History className="w-3 h-3" /> },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                    activeTab === key
                      ? 'bg-brand-500/25 text-brand-300'
                      : 'text-white/30 hover:text-white/60'
                  )}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Route List (scrollable) ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {activeTab === 'routes' && (
            <RouteList
              routes={routes}
              selectedRoute={selectedRoute}
              isLoading={isLoading}
              error={error}
              onRouteSelect={onRouteSelect}
              onSaveRoute={onSaveRoute}
              onRetry={onRetry}
            />
          )}
          {activeTab === 'saved' && (
            <SavedRoutesList userId={user?.id} />
          )}
          {activeTab === 'history' && (
            <div className="py-12 text-center text-white/30 text-sm">History coming soon</div>
          )}
        </div>
      </div>

      {/* AuthModal rendered at document.body level to escape overflow-hidden */}
      {authOpen && typeof document !== 'undefined' &&
        createPortal(
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />,
          document.body
        )
      }
    </>
  );
}

// ─── Saved Routes Mini-List ───────────────────────────────────────────────────

function SavedRoutesList({ userId }: { userId?: string }) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetch('/api/saved-routes')
      .then((r) => r.json())
      .then((d) => setRoutes(d.routes ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <div className="py-8 text-center text-white/30 text-sm">Loading saved routes…</div>;
  }

  if (routes.length === 0) {
    return (
      <div className="py-12 text-center text-white/30 text-sm">
        <BookmarkCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
        No saved routes yet. Search for a route and save it!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {routes.map((r) => (
        <div key={r.id} className="p-3 rounded-xl bg-white/4 border border-white/8">
          <p className="text-sm font-medium text-white truncate">{r.name}</p>
          <p className="text-xs text-white/40 mt-1 truncate">{r.origin} → {r.destination}</p>
          <p className="text-xs text-white/25 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
