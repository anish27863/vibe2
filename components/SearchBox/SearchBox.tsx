'use client';

/**
 * SearchBox component
 * Autocomplete input for origin/destination with Google Places suggestions.
 * Uses our secure /api/places proxy – no client-side API key needed.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MapPin, X, Loader2, Navigation2, Search } from 'lucide-react';
import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete';
import type { PlaceResult } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SearchBoxProps {
  value:         string;
  onChange:      (value: string) => void;
  onSelect:      (place: PlaceResult) => void;
  placeholder:   string;
  type:          'origin' | 'destination';
  className?:    string;
}

export default function SearchBox({
  value,
  onChange,
  onSelect,
  placeholder,
  type,
  className,
}: SearchBoxProps) {
  const [isOpen,   setIsOpen]   = useState(false);
  const [focused,  setFocused]  = useState(false);
  const inputRef   = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { predictions, isLoading, fetchPredictions, clearPredictions } =
    usePlacesAutocomplete();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        clearPredictions();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [clearPredictions]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange(val);
      fetchPredictions(val);
      setIsOpen(true);
    },
    [onChange, fetchPredictions]
  );

  const handleSelect = useCallback(
    (place: PlaceResult) => {
      onChange(place.description);
      onSelect(place);
      setIsOpen(false);
      clearPredictions();
      inputRef.current?.blur();
    },
    [onChange, onSelect, clearPredictions]
  );

  const handleClear = useCallback(() => {
    onChange('');
    clearPredictions();
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange, clearPredictions]);

  const iconColor = type === 'origin' ? 'text-emerald-400' : 'text-rose-400';
  const Icon      = type === 'origin' ? Navigation2 : MapPin;

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      {/* Input Wrapper */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-3 rounded-xl transition-all duration-200',
          'bg-white/5 border border-white/10 backdrop-blur-sm',
          focused
            ? 'border-brand-400/60 bg-white/8 shadow-glow ring-1 ring-brand-400/30'
            : 'hover:border-white/20 hover:bg-white/7'
        )}
      >
        <Icon className={cn('w-4 h-4 shrink-0', iconColor)} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => { setFocused(true); if (value.length >= 2) setIsOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="w-4 h-4 text-white/30 animate-spin shrink-0" />
        )}
        {value && !isLoading && (
          <button onClick={handleClear} className="text-white/30 hover:text-white transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Predictions */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-white/10 bg-surface-secondary/95 backdrop-blur-xl shadow-glass overflow-hidden animate-slide-in-up">
          {predictions.map((place, idx) => (
            <button
              key={place.placeId || idx}
              onMouseDown={() => handleSelect(place)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/8 transition-colors group"
            >
              <MapPin className="w-4 h-4 text-brand-400 mt-0.5 shrink-0 group-hover:text-brand-300 transition-colors" />
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {place.mainText}
                </p>
                <p className="text-xs text-white/50 truncate">
                  {place.secondaryText}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && !isLoading && predictions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-white/10 bg-surface-secondary/95 backdrop-blur-xl shadow-glass overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 text-white/40 text-sm">
            <Search className="w-4 h-4" />
            No places found for &quot;{value}&quot;
          </div>
        </div>
      )}
    </div>
  );
}
