/**
 * Google Maps API helpers & response parsers.
 * Used by server-side API routes to fetch and transform Google API responses.
 */

import type {
  SmartRouteOption,
  RouteLeg,
  RouteStep,
  LatLng,
} from './types';

const GOOGLE_MAPS_API_BASE = 'https://maps.googleapis.com/maps/api';

// ─── Directions API ────────────────────────────────────────────────────────────

export interface DirectionsFetchParams {
  origin: string;
  destination: string;
  travelMode: string;
  avoidHighways: boolean;
  avoidTolls: boolean;
  departureTime?: string; // ISO string or 'now'
}

/**
 * Fetch directions from Google Maps Directions API (server-side).
 * Returns raw route data parsed into our internal format.
 */
export async function fetchDirections(
  params: DirectionsFetchParams,
  apiKey: string
): Promise<Omit<SmartRouteOption, 'score' | 'label' | 'scoreBreakdown' | 'color' | 'trafficLevel' | 'roadTypeDistribution'>[]> {
  const avoid: string[] = [];
  if (params.avoidHighways) avoid.push('highways');
  if (params.avoidTolls)    avoid.push('tolls');

  const queryParams = new URLSearchParams({
    origin:       params.origin,
    destination:  params.destination,
    alternatives: 'true',
    mode:         params.travelMode.toLowerCase(),
    departure_time: 'now', // enables traffic data
    traffic_model:  'best_guess',
    key:            apiKey,
  });

  if (avoid.length > 0) {
    queryParams.set('avoid', avoid.join('|'));
  }

  const url = `${GOOGLE_MAPS_API_BASE}/directions/json?${queryParams.toString()}`;

  const response = await fetch(url, {
    next: { revalidate: 60 }, // cache for 60 seconds (Next.js caching)
  });

  if (!response.ok) {
    throw new Error(`Directions API HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK') {
    if (data.status === 'ZERO_RESULTS') {
      return [];
    }
    throw new Error(`Directions API error: ${data.status} - ${data.error_message || ''}`);
  }

  return data.routes.map((route: any, index: number) => parseGoogleRoute(route, index));
}

/**
 * Parse a raw Google Directions API route into our SmartRouteOption format.
 */
function parseGoogleRoute(
  googleRoute: any,
  index: number
): Omit<SmartRouteOption, 'score' | 'label' | 'scoreBreakdown' | 'color' | 'trafficLevel' | 'roadTypeDistribution'> {
  const legs: RouteLeg[] = googleRoute.legs.map((leg: any) => ({
    distance:           leg.distance?.value ?? 0,
    duration:           leg.duration?.value ?? 0,
    durationInTraffic:  leg.duration_in_traffic?.value ?? leg.duration?.value ?? 0,
    startAddress:       leg.start_address ?? '',
    endAddress:         leg.end_address ?? '',
    steps: leg.steps.map((step: any): RouteStep => ({
      distance:         step.distance?.value ?? 0,
      duration:         step.duration?.value ?? 0,
      htmlInstructions: step.html_instructions ?? '',
      travelMode:       step.travel_mode ?? 'DRIVING',
    })),
  }));

  const totalDistance           = legs.reduce((sum, l) => sum + l.distance, 0);
  const totalDuration           = legs.reduce((sum, l) => sum + l.duration, 0);
  const totalDurationInTraffic  = legs.reduce((sum, l) => sum + l.durationInTraffic, 0);

  return {
    id:               `route_${index}`,
    index,
    summary:          googleRoute.summary ?? `Route ${index + 1}`,
    legs,
    overviewPolyline: googleRoute.overview_polyline?.points ?? '',
    bounds: {
      northeast: {
        lat: googleRoute.bounds?.northeast?.lat ?? 0,
        lng: googleRoute.bounds?.northeast?.lng ?? 0,
      },
      southwest: {
        lat: googleRoute.bounds?.southwest?.lat ?? 0,
        lng: googleRoute.bounds?.southwest?.lng ?? 0,
      },
    },
    warnings:                googleRoute.warnings ?? [],
    totalDistance,
    totalDuration,
    totalDurationInTraffic,
  };
}

// ─── Places Autocomplete API ────────────────────────────────────────────────

export async function fetchPlaceAutocomplete(
  input: string,
  apiKey: string,
  sessionToken?: string
) {
  const params = new URLSearchParams({
    input,
    key: apiKey,
    ...(sessionToken && { sessiontoken: sessionToken }),
  });

  const url = `${GOOGLE_MAPS_API_BASE}/place/autocomplete/json?${params.toString()}`;

  const response = await fetch(url, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Places API HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${data.status}`);
  }

  return (data.predictions ?? []).map((pred: any) => ({
    placeId:       pred.place_id,
    description:   pred.description,
    mainText:      pred.structured_formatting?.main_text ?? pred.description,
    secondaryText: pred.structured_formatting?.secondary_text ?? '',
  }));
}

// ─── Polyline Decoder ─────────────────────────────────────────────────────────

/**
 * Decode Google's encoded polyline format into lat/lng array.
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}
