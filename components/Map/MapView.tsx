'use client';

/**
 * MapView component — powered by Leaflet + OpenStreetMap / CartoDB tiles.
 * Completely free, no API key needed for the map itself.
 *
 * Tile sources:
 *   • Dark mode:  CartoDB Dark Matter (free, no key)
 *   • Light mode: OpenStreetMap Standard (free, no key)
 *
 * Routes are drawn as coloured Polylines decoded from ORS encoded geometry.
 */

import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Tooltip,
  useMap,
  ZoomControl,
} from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SmartRouteOption, LatLng } from '@/lib/types';
import { decodePolyline } from '@/lib/routing';

// ─── Fix Leaflet default icon URLs broken by Webpack ─────────────────────────

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Custom DivIcon markers ───────────────────────────────────────────────────

function makeMarkerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:16px; height:16px; border-radius:50%;
        background:${color}; border:2.5px solid #fff;
        box-shadow:0 0 8px ${color}88, 0 2px 6px rgba(0,0,0,0.5);
      "></div>`,
    iconSize:   [16, 16],
    iconAnchor: [8, 8],
  });
}

const ORIGIN_ICON = makeMarkerIcon('#10b981');
const DEST_ICON   = makeMarkerIcon('#ef4444');

// ─── FitBounds helper ─────────────────────────────────────────────────────────

function FitBounds({ routes }: { routes: SmartRouteOption[] }) {
  const map = useMap();
  const prevLen = useRef(0);

  useEffect(() => {
    if (routes.length === 0 || routes.length === prevLen.current) return;
    prevLen.current = routes.length;

    const allPoints: LatLngExpression[] = routes.flatMap((r) =>
      decodePolyline(r.overviewPolyline).map((p) => [p.lat, p.lng] as LatLngExpression)
    );

    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [60, 60] });
    }
  }, [routes, map]);

  return null;
}

// ─── Tile URLs ────────────────────────────────────────────────────────────────

const TILES = {
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

const ATTRIBUTION = {
  dark:  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  light: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

// ─── Main MapView ─────────────────────────────────────────────────────────────

interface MapViewProps {
  routes:        SmartRouteOption[];
  selectedRoute: SmartRouteOption | null;
  originCoords:  LatLng | null;
  destCoords:    LatLng | null;
  originLabel:   string;
  destLabel:     string;
  onRouteClick:  (route: SmartRouteOption) => void;
  isDarkMode:    boolean;
}

export default function MapView({
  routes,
  selectedRoute,
  originCoords,
  destCoords,
  originLabel,
  destLabel,
  onRouteClick,
  isDarkMode,
}: MapViewProps) {
  const defaultCenter: LatLngExpression = originCoords
    ? [originCoords.lat, originCoords.lng]
    : destCoords
    ? [destCoords.lat, destCoords.lng]
    : [20.5937, 78.9629]; // India

  // ── Cleanup: remove Leaflet's internal tracking ID on unmount ─────────────
  // This makes re-initialization safe under React Strict Mode (which mounts →
  // unmounts → remounts in development) and avoids the "already initialized" error.
  useEffect(() => {
    return () => {
      document.querySelectorAll('.leaflet-container').forEach((el) => {
        delete (el as any)._leaflet_id;
      });
    };
  }, []);

  return (
    <MapContainer
      // Static key — MapContainer NEVER remounts (tiles switch inside).
      // A changing key would force Leaflet to reinitialize on a container
      // that still carries its old _leaflet_id, causing the error.
      key="smartroute-leaflet-map"
      center={defaultCenter}
      zoom={originCoords ? 13 : 5}
      className="w-full h-full"
      zoomControl={false}
      style={{ background: isDarkMode ? '#0f0f1a' : '#e8e8e8' }}
    >
      {/* Map tiles */}
      <TileLayer
        url={isDarkMode ? TILES.dark : TILES.light}
        attribution={isDarkMode ? ATTRIBUTION.dark : ATTRIBUTION.light}
        maxZoom={19}
      />

      {/* Zoom controls (top-right) */}
      <ZoomControl position="topright" />

      {/* Auto-fit when routes change */}
      <FitBounds routes={routes} />

      {/* Route Polylines – draw unselected first (behind), then selected on top */}
      {[...routes]
        .sort((a, b) => {
          if (a.id === selectedRoute?.id) return 1;
          if (b.id === selectedRoute?.id) return -1;
          return 0;
        })
        .map((route) => {
          const isSelected = route.id === selectedRoute?.id;
          const positions  = decodePolyline(route.overviewPolyline).map(
            (p) => [p.lat, p.lng] as LatLngExpression
          );

          return (
            <React.Fragment key={route.id}>
              {/* Glow halo behind selected route */}
              {isSelected && (
                <Polyline
                  positions={positions}
                  color={route.color}
                  weight={14}
                  opacity={0.18}
                />
              )}
              {/* Main route line */}
              <Polyline
                positions={positions}
                color={route.color}
                weight={isSelected ? 6 : 4}
                opacity={isSelected ? 0.95 : 0.45}
                eventHandlers={{ click: () => onRouteClick(route) }}
              >
                <Tooltip
                  sticky
                  className="route-tooltip"
                  direction="auto"
                >
                  <span style={{ color: route.color, fontWeight: 600 }}>
                    {route.label}
                  </span>
                  {' — '}
                  {Math.round(route.totalDistance / 1000 * 10) / 10} km
                </Tooltip>
              </Polyline>
            </React.Fragment>
          );
        })}

      {/* Origin marker */}
      {originCoords && (
        <Marker
          position={[originCoords.lat, originCoords.lng]}
          icon={ORIGIN_ICON}
        >
          <Tooltip direction="top" permanent={false}>
            <strong>Start:</strong>{' '}
            {originLabel.length > 30 ? originLabel.slice(0, 28) + '…' : originLabel}
          </Tooltip>
        </Marker>
      )}

      {/* Destination marker */}
      {destCoords && (
        <Marker
          position={[destCoords.lat, destCoords.lng]}
          icon={DEST_ICON}
        >
          <Tooltip direction="top" permanent={false}>
            <strong>End:</strong>{' '}
            {destLabel.length > 30 ? destLabel.slice(0, 28) + '…' : destLabel}
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}
