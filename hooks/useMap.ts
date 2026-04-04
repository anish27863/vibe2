'use client';

/**
 * useMap hook
 * Manages Google Map state: center, zoom, and loaded status.
 */

import { useState, useCallback } from 'react';
import type { LatLng, SmartRouteOption } from '@/lib/types';
import { decodePolyline } from '@/lib/googleMaps';

const DEFAULT_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 }; // India center

export function useMap() {
  const [center,    setCenter]    = useState<LatLng>(DEFAULT_CENTER);
  const [zoom,      setZoom]      = useState(5);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapRef,    setMapRef]    = useState<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
    setMapLoaded(true);
  }, []);

  /**
   * Fit the map bounds to show all routes' polylines.
   */
  const fitToBounds = useCallback((routes: SmartRouteOption[]) => {
    if (!mapRef || routes.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    for (const route of routes) {
      // Use the route's geographic bounds
      if (route.bounds) {
        bounds.extend(route.bounds.northeast);
        bounds.extend(route.bounds.southwest);
      } else if (route.overviewPolyline) {
        // Fall back to decoding polyline
        const points = decodePolyline(route.overviewPolyline);
        for (const pt of points) bounds.extend(pt);
      }
    }

    mapRef.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  }, [mapRef]);

  /**
   * Pan & zoom to a single route.
   */
  const focusRoute = useCallback((route: SmartRouteOption) => {
    if (!mapRef) return;
    const bounds = new google.maps.LatLngBounds();
    if (route.bounds) {
      bounds.extend(route.bounds.northeast);
      bounds.extend(route.bounds.southwest);
    }
    mapRef.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
  }, [mapRef]);

  /**
   * Pan to a coordinate.
   */
  const panTo = useCallback((coords: LatLng, z?: number) => {
    if (!mapRef) return;
    mapRef.panTo(coords);
    if (z) mapRef.setZoom(z);
  }, [mapRef]);

  return {
    center,
    zoom,
    mapLoaded,
    mapRef,
    onMapLoad,
    fitToBounds,
    focusRoute,
    panTo,
    setCenter,
    setZoom,
  };
}
