'use client';

/**
 * usePreferences hook
 * Manages user route preferences with local state + Supabase persistence.
 */

import { useState, useCallback, useEffect } from 'react';
import type { RoutePreferences, VehicleType, TravelMode } from '@/lib/types';
import { useAuth } from './useAuth';

const DEFAULT_PREFERENCES: RoutePreferences = {
  avoidTraffic:           false,
  preferShortestTime:     false,
  preferShortestDistance: false,
  bikeFriendly:           false,
  avoidHighways:          false,
  avoidTolls:             false,
  vehicleType:            'car',
  travelMode:             'DRIVING',
};

/**
 * Map vehicle type to appropriate travel mode automatically.
 */
function vehicleToTravelMode(vehicleType: VehicleType): TravelMode {
  const map: Record<VehicleType, TravelMode> = {
    car:        'DRIVING',
    motorcycle: 'DRIVING',
    bike:       'BICYCLING',
    walking:    'WALKING',
    transit:    'TRANSIT',
  };
  return map[vehicleType] ?? 'DRIVING';
}

export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<RoutePreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from Supabase on auth
  useEffect(() => {
    if (!user) return;

    fetch('/api/preferences')
      .then((r) => r.json())
      .then(({ preferences: prefs }) => {
        if (prefs) {
          setPreferences({
            avoidTraffic:           prefs.avoid_traffic           ?? DEFAULT_PREFERENCES.avoidTraffic,
            preferShortestTime:     prefs.prefer_shortest_time    ?? DEFAULT_PREFERENCES.preferShortestTime,
            preferShortestDistance: prefs.prefer_shortest_distance ?? DEFAULT_PREFERENCES.preferShortestDistance,
            bikeFriendly:           prefs.bike_friendly           ?? DEFAULT_PREFERENCES.bikeFriendly,
            avoidHighways:          prefs.avoid_highways          ?? DEFAULT_PREFERENCES.avoidHighways,
            avoidTolls:             prefs.avoid_tolls             ?? DEFAULT_PREFERENCES.avoidTolls,
            vehicleType:            prefs.vehicle_type            ?? DEFAULT_PREFERENCES.vehicleType,
            travelMode:             prefs.travel_mode             ?? DEFAULT_PREFERENCES.travelMode,
          });
        }
      })
      .catch(console.error);
  }, [user?.id]);

  const updatePreference = useCallback(
    <K extends keyof RoutePreferences>(key: K, value: RoutePreferences[K]) => {
      setPreferences((prev) => {
        const updated = { ...prev, [key]: value };
        // Auto-update travel mode when vehicle type changes
        if (key === 'vehicleType') {
          updated.travelMode = vehicleToTravelMode(value as VehicleType);
          // Auto-enable bike friendly for bike
          if (value === 'bike') updated.bikeFriendly = true;
          else if (value !== 'bike') updated.bikeFriendly = false;
        }
        return updated;
      });
    },
    []
  );

  const savePreferences = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setIsSaving(false);
    }
  }, [preferences, user]);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    preferences,
    updatePreference,
    savePreferences,
    resetPreferences,
    isSaving,
    DEFAULT_PREFERENCES,
  };
}
