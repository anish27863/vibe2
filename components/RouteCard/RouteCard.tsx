'use client';

/**
 * RouteCard component
 * Displays a single scored route option with its label, stats, and score breakdown.
 */

import React from 'react';
import { Clock, Ruler, Zap, ChevronRight, AlertTriangle } from 'lucide-react';
import type { SmartRouteOption } from '@/lib/types';
import {
  formatDuration,
  formatDistance,
  getTrafficColor,
  getLabelColor,
} from '@/lib/scoring';
import { cn } from '@/lib/utils';

interface RouteCardProps {
  route:      SmartRouteOption;
  isSelected: boolean;
  onSelect:   (route: SmartRouteOption) => void;
  onSave?:    (route: SmartRouteOption) => void;
  rank:       number;
}

const TRAFFIC_LABELS: Record<string, string> = {
  low:       'Low Traffic',
  moderate:  'Moderate',
  high:      'Heavy Traffic',
  very_high: 'Severe Congestion',
};

const TRAFFIC_BG: Record<string, string> = {
  low:       'bg-emerald-500/15 text-emerald-400',
  moderate:  'bg-amber-500/15 text-amber-400',
  high:      'bg-red-500/15 text-red-400',
  very_high: 'bg-red-700/15 text-red-500',
};

export default function RouteCard({ route, isSelected, onSelect, onSave, rank }: RouteCardProps) {
  const delaySeconds = route.totalDurationInTraffic - route.totalDuration;
  const hasDelay     = delaySeconds > 60;
  const labelColor   = getLabelColor(route.label);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(route)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(route)}
      className={cn(
        'w-full text-left rounded-xl border transition-all duration-200 p-4 group cursor-pointer',
        'animate-slide-in-up',
        isSelected
          ? 'border-brand-400/50 bg-brand-500/10 shadow-glow'
          : 'border-white/8 bg-white/4 hover:border-white/20 hover:bg-white/7'
      )}
      style={{ animationDelay: `${rank * 80}ms`, animationFillMode: 'both' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Rank indicator */}
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: route.color }}
          >
            {rank + 1}
          </span>

          {/* Route label badge */}
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: `${labelColor}20`, color: labelColor }}
          >
            {route.label}
          </span>

          {/* Traffic badge */}
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', TRAFFIC_BG[route.trafficLevel])}>
            {TRAFFIC_LABELS[route.trafficLevel]}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Score */}
          <div className="text-right">
            <div className="text-xs text-white/40 leading-none">Score</div>
            <div className="text-sm font-bold text-brand-300 leading-tight">{route.score}</div>
          </div>
          <ChevronRight
            className={cn(
              'w-4 h-4 transition-all duration-200',
              isSelected ? 'text-brand-400 rotate-90' : 'text-white/20 group-hover:text-white/40'
            )}
          />
        </div>
      </div>

      {/* Route summary */}
      {route.summary && (
        <p className="text-xs text-white/40 mb-3 truncate">via {route.summary}</p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-sm font-semibold text-white">
            {formatDuration(route.totalDurationInTraffic)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-white/50" />
          <span className="text-sm text-white/70">
            {formatDistance(route.totalDistance)}
          </span>
        </div>
        {hasDelay && (
          <div className="flex items-center gap-1 text-amber-400 ml-auto">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">+{formatDuration(delaySeconds)} delay</span>
          </div>
        )}
      </div>

      {/* Score breakdown (visible when selected) */}
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-white/8 grid grid-cols-2 gap-2 animate-fade-in">
          <ScoreBar label="Time"      value={route.scoreBreakdown.timeScore}      color="#6366f1" />
          <ScoreBar label="Traffic"   value={route.scoreBreakdown.trafficScore}   color="#10b981" />
          <ScoreBar label="Distance"  value={route.scoreBreakdown.distanceScore}  color="#f59e0b" />
          <ScoreBar label="Road Type" value={route.scoreBreakdown.roadTypeScore}  color="#8b5cf6" />
        </div>
      )}

      {/* Road type distribution bar */}
      <div className="mt-3 flex h-1.5 rounded-full overflow-hidden gap-px">
        <div
          className="rounded-l-full transition-all"
          style={{
            width:           `${route.roadTypeDistribution.highwayPercent}%`,
            backgroundColor: '#6366f1',
          }}
          title={`Highway: ${Math.round(route.roadTypeDistribution.highwayPercent)}%`}
        />
        <div
          className="transition-all"
          style={{
            width:           `${route.roadTypeDistribution.arterialPercent}%`,
            backgroundColor: '#f59e0b',
          }}
          title={`Arterial: ${Math.round(route.roadTypeDistribution.arterialPercent)}%`}
        />
        <div
          className="transition-all"
          style={{
            width:           `${route.roadTypeDistribution.localPercent}%`,
            backgroundColor: '#10b981',
          }}
          title={`Local: ${Math.round(route.roadTypeDistribution.localPercent)}%`}
        />
        <div
          className="rounded-r-full transition-all"
          style={{
            width:           `${route.roadTypeDistribution.bikePathPercent}%`,
            backgroundColor: '#06b6d4',
          }}
          title={`Bike path: ${Math.round(route.roadTypeDistribution.bikePathPercent)}%`}
        />
      </div>
      <div className="flex items-center gap-3 mt-1">
        {route.roadTypeDistribution.highwayPercent > 5 && (
          <span className="text-[10px] text-white/30">
            <span style={{ color: '#6366f1' }}>●</span> Highway {Math.round(route.roadTypeDistribution.highwayPercent)}%
          </span>
        )}
        {route.roadTypeDistribution.arterialPercent > 5 && (
          <span className="text-[10px] text-white/30">
            <span style={{ color: '#f59e0b' }}>●</span> Arterial {Math.round(route.roadTypeDistribution.arterialPercent)}%
          </span>
        )}
        {route.roadTypeDistribution.localPercent > 5 && (
          <span className="text-[10px] text-white/30">
            <span style={{ color: '#10b981' }}>●</span> Local {Math.round(route.roadTypeDistribution.localPercent)}%
          </span>
        )}
      </div>

      {/* Warnings */}
      {route.warnings && route.warnings.length > 0 && (
        <div className="mt-2">
          {route.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-400/70 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {w}
            </p>
          ))}
        </div>
      )}

      {/* Save button (when selected) */}
      {isSelected && onSave && (
        <button
          onClick={(e) => { e.stopPropagation(); onSave(route); }}
          className="mt-3 w-full py-2 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 text-xs font-medium transition-colors flex items-center justify-center gap-1"
        >
          <Zap className="w-3 h-3" />
          Save this route
        </button>
      )}
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[10px] text-white/40">{label}</span>
        <span className="text-[10px] font-semibold text-white/60">{value}</span>
      </div>
      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
