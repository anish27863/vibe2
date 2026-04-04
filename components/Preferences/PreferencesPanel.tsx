'use client';

/**
 * PreferencesPanel component
 * Toggle panel for route options: vehicle type, avoid traffic, bike-friendly, etc.
 */

import React from 'react';
import {
  Car, Bike, Footprints, Bus, Zap, Shield,
  Clock, Ruler, Route, ChevronDown
} from 'lucide-react';
import type { RoutePreferences, VehicleType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PreferencesPanelProps {
  preferences:      RoutePreferences;
  onUpdate:         <K extends keyof RoutePreferences>(key: K, value: RoutePreferences[K]) => void;
  isOpen:           boolean;
  onToggle:         () => void;
}

const VEHICLE_OPTIONS: { type: VehicleType; label: string; icon: React.ReactNode }[] = [
  { type: 'car',        label: 'Car',     icon: <Car className="w-4 h-4" />            },
  { type: 'bike',       label: 'Bike',    icon: <Bike className="w-4 h-4" />           },
  { type: 'walking',    label: 'Walk',    icon: <Footprints className="w-4 h-4" /> },
  { type: 'transit',    label: 'Transit', icon: <Bus className="w-4 h-4" />            },
];

interface ToggleProps {
  checked:  boolean;
  onChange: (v: boolean) => void;
  label:    string;
  icon:     React.ReactNode;
  hint?:    string;
}

function Toggle({ checked, onChange, label, icon, hint }: ToggleProps) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group py-1">
      <div className="flex items-center gap-2">
        <span className={cn('text-sm', checked ? 'text-brand-300' : 'text-white/50 group-hover:text-white/70')}>
          {icon}
        </span>
        <div>
          <span className={cn('text-sm font-medium', checked ? 'text-white' : 'text-white/60 group-hover:text-white/80')}>
            {label}
          </span>
          {hint && <p className="text-[10px] text-white/30">{hint}</p>}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'w-10 h-5.5 rounded-full relative transition-all duration-200 shrink-0',
          checked ? 'bg-brand-500' : 'bg-white/10'
        )}
        style={{ height: '22px' }}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </label>
  );
}

export default function PreferencesPanel({
  preferences,
  onUpdate,
  isOpen,
  onToggle,
}: PreferencesPanelProps) {
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden bg-white/3">
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-semibold text-white">Route Options</span>
        </div>
        <ChevronDown
          className={cn('w-4 h-4 text-white/40 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {/* Collapsible Body */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* Vehicle / Mode selector */}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Travel Mode</p>
            <div className="grid grid-cols-4 gap-1.5">
              {VEHICLE_OPTIONS.map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => onUpdate('vehicleType', type)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                    preferences.vehicleType === type
                      ? 'bg-brand-500/25 text-brand-300 border border-brand-400/40'
                      : 'bg-white/4 text-white/40 hover:bg-white/8 hover:text-white/70 border border-transparent'
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/6" />

          {/* Toggle options */}
          <div className="space-y-1">
            <Toggle
              checked={preferences.avoidTraffic}
              onChange={(v) => onUpdate('avoidTraffic', v)}
              label="Avoid Traffic"
              icon={<Shield className="w-4 h-4" />}
              hint="Prioritise less congested roads"
            />
            <Toggle
              checked={preferences.preferShortestTime}
              onChange={(v) => onUpdate('preferShortestTime', v)}
              label="Fastest Route"
              icon={<Clock className="w-4 h-4" />}
              hint="Minimise travel time"
            />
            <Toggle
              checked={preferences.preferShortestDistance}
              onChange={(v) => onUpdate('preferShortestDistance', v)}
              label="Shortest Distance"
              icon={<Ruler className="w-4 h-4" />}
              hint="Minimise kilometres"
            />
            <Toggle
              checked={preferences.bikeFriendly}
              onChange={(v) => onUpdate('bikeFriendly', v)}
              label="Bike Friendly"
              icon={<Bike className="w-4 h-4" />}
              hint="Prefer cycle lanes & local roads"
            />
            <Toggle
              checked={preferences.avoidHighways}
              onChange={(v) => onUpdate('avoidHighways', v)}
              label="Avoid Highways"
              icon={<Route className="w-4 h-4" />}
            />
            <Toggle
              checked={preferences.avoidTolls}
              onChange={(v) => onUpdate('avoidTolls', v)}
              label="Avoid Tolls"
              icon={<Shield className="w-4 h-4" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}
