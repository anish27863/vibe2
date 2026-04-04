/**
 * Routing & Geocoding helpers using free, open-source APIs:
 *
 * • OpenRouteService (ORS)  – directions / alternatives (2000 req/day free)
 *     https://openrouteservice.org
 * • Nominatim (OpenStreetMap) – geocoding & place search (no key needed)
 *     https://nominatim.openstreetmap.org
 *
 * IMPORTANT: ORS returns coordinates as [longitude, latitude] (GeoJSON order).
 *            Our app uses { lat, lng }. Every conversion is explicit below.
 */

import type {
  SmartRouteOption,
  RouteLeg,
  RouteStep,
  LatLng,
  PlaceResult,
  RoadTypeDistribution,
  VehicleType,
} from './types';

const ORS_BASE = 'https://api.openrouteservice.org/v2';

// ─── Profile mapping ──────────────────────────────────────────────────────────

export const VEHICLE_TO_PROFILE: Record<VehicleType, string> = {
  car:        'driving-car',
  motorcycle: 'driving-car',
  bike:       'cycling-regular',
  walking:    'foot-walking',
  transit:    'driving-car',   // ORS has no transit; fallback to driving
};

// ─── ORS Waytype → our RoadType ───────────────────────────────────────────────
//
// ORS waytype codes:
//  0 = Unknown  1 = State Road (highway)  2 = Road (arterial)
//  3 = Street   4 = Path                  5 = Track
//  6 = Cycleway 7 = Footway               8 = Steps
//  9 = Ferry   10 = Construction

function orsWaytypeToCategory(value: number): keyof RoadTypeDistribution {
  if (value === 1)                  return 'highwayPercent';
  if (value === 2)                  return 'arterialPercent';
  if (value >= 3 && value <= 5)    return 'localPercent';
  if (value === 6 || value === 7)  return 'bikePathPercent';
  return 'localPercent'; // default unknown → local
}

/**
 * Build RoadTypeDistribution from ORS extras.waytype.summary.
 */
export function roadDistributionFromORS(
  summary: Array<{ value: number; distance: number; amount: number }>,
  totalDistance: number,
): RoadTypeDistribution {
  const totals = { highwayPercent: 0, arterialPercent: 0, localPercent: 0, bikePathPercent: 0 };
  const d = totalDistance || 1;

  for (const item of summary) {
    const key = orsWaytypeToCategory(item.value);
    totals[key] += (item.distance / d) * 100;
  }

  return totals;
}

// ─── Raw ORS types ────────────────────────────────────────────────────────────

interface ORSStep {
  distance: number;
  duration: number;
  instruction: string;
  name: string;
}

interface ORSSegment {
  distance: number;
  duration: number;
  steps: ORSStep[];
}

interface ORSRoute {
  summary: { distance: number; duration: number };
  segments: ORSSegment[];
  geometry: string; // Google-encoded polyline, 5-decimal precision
  extras?: {
    waytype?: {
      summary: Array<{ value: number; distance: number; amount: number }>;
    };
  };
  warnings?: Array<{ code: number; message: string }>;
}

// ─── Fetch directions from ORS ────────────────────────────────────────────────

export interface ORSFetchParams {
  originCoords:      LatLng;
  destinationCoords: LatLng;
  vehicleType:       VehicleType;
  avoidHighways:     boolean;
  avoidTolls:        boolean;
}

type ParsedRoute = Omit<SmartRouteOption,
  'score' | 'label' | 'scoreBreakdown' | 'color' | 'trafficLevel' | 'totalDurationInTraffic'>;

export async function fetchORSDirections(
  params: ORSFetchParams,
  apiKey: string,
): Promise<ParsedRoute[]> {
  const profile = VEHICLE_TO_PROFILE[params.vehicleType] || 'driving-car';

  const avoidFeatures: string[] = [];
  if (params.avoidHighways) avoidFeatures.push('highways');
  if (params.avoidTolls)    avoidFeatures.push('tollways');

  // ORS expects [lng, lat] order
  const body: Record<string, unknown> = {
    coordinates: [
      [params.originCoords.lng, params.originCoords.lat],
      [params.destinationCoords.lng, params.destinationCoords.lat],
    ],
    instructions:   true,
    geometry:       true,
    extra_info:     ['waytype'],
    preference:     'recommended',
  };

  // Alternative routes (reliable for driving; attempted for others)
  body.alternative_routes = {
    target_count:  3,
    share_factor:  0.6,
    weight_factor: 1.4,
  };

  if (avoidFeatures.length > 0) {
    body.options = { avoid_features: avoidFeatures };
  }

  const url = `${ORS_BASE}/directions/${profile}`;

  const response = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
    },
    body: JSON.stringify(body),
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const msg = errBody?.error?.message || errBody?.message || `HTTP ${response.status}`;
    throw new Error(`ORS API error: ${msg}`);
  }

  const data = await response.json();
  const routes: ORSRoute[] = data.routes ?? [];

  if (routes.length === 0) return [];

  return routes.map((route, index) => parseORSRoute(route, index));
}

/**
 * Parse a raw ORS route into our internal SmartRouteOption shape.
 */
function parseORSRoute(orsRoute: ORSRoute, index: number): ParsedRoute {
  const totalDistance = orsRoute.summary.distance;
  const totalDuration = Math.round(orsRoute.summary.duration);

  const steps: RouteStep[] = orsRoute.segments.flatMap((seg) =>
    seg.steps.map((step) => ({
      distance:         step.distance,
      duration:         step.duration,
      htmlInstructions: step.instruction || '',
      travelMode:       'DRIVING',
    })),
  );

  const leg: RouteLeg = {
    distance:          totalDistance,
    duration:          totalDuration,
    durationInTraffic: totalDuration, // filled by scoring (traffic simulation)
    startAddress:      '',
    endAddress:        '',
    steps,
  };

  // Road type distribution from ORS extras
  let roadTypeDistribution: RoadTypeDistribution;
  if (orsRoute.extras?.waytype?.summary?.length) {
    roadTypeDistribution = roadDistributionFromORS(
      orsRoute.extras.waytype.summary,
      totalDistance,
    );
  } else {
    // Fallback neutral distribution
    roadTypeDistribution = {
      highwayPercent:  25,
      arterialPercent: 50,
      localPercent:    25,
      bikePathPercent: 0,
    };
  }

  return {
    id:               `route_${index}`,
    index,
    summary:          orsRoute.segments[0]?.steps[0]?.name || `Route ${index + 1}`,
    legs:             [leg],
    overviewPolyline: orsRoute.geometry,
    bounds:           { northeast: { lat: 0, lng: 0 }, southwest: { lat: 0, lng: 0 } },
    warnings:         (orsRoute.warnings ?? []).map((w) => w.message),
    totalDistance,
    totalDuration,
    roadTypeDistribution,
  };
}

// ─── Nominatim (OpenStreetMap) — geocoding & autocomplete ────────────────────
//
// Nominatim terms of use:
//  • Provide a User-Agent header identifying your app
//  • Max 1 request per second (our 300 ms debounce handles this)
//  • Attribution required in the UI: "© OpenStreetMap contributors"

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const NOMINATIM_HEADERS = {
  'User-Agent': 'SmartRoute/1.0 (https://github.com/your-repo/smartroute)',
  'Accept-Language': 'en',
};

/**
 * Autocomplete / place search via Nominatim.
 * Returns results with embedded coordinates (no extra geocoding needed!).
 */
export async function fetchNominatimSearch(query: string): Promise<PlaceResult[]> {
  const url =
    `${NOMINATIM_BASE}/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json&limit=6&addressdetails=1`;

  const response = await fetch(url, {
    headers: NOMINATIM_HEADERS,
    next: { revalidate: 30 },
  });

  if (!response.ok) throw new Error(`Nominatim search error: ${response.status}`);

  const results: any[] = await response.json();

  return results.map((item) => {
    const addr = item.address || {};
    const mainText =
      addr.city       ||
      addr.town       ||
      addr.village    ||
      addr.municipality ||
      addr.suburb     ||
      item.display_name.split(',')[0].trim();

    const secondary = [addr.state, addr.country].filter(Boolean).join(', ');

    return {
      placeId:       String(item.place_id),
      description:   item.display_name,
      mainText,
      secondaryText: secondary,
      coords: {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      },
    } satisfies PlaceResult;
  });
}

/**
 * Geocode a free-text address to coordinates via Nominatim.
 */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const url =
    `${NOMINATIM_BASE}/search` +
    `?q=${encodeURIComponent(address)}` +
    `&format=json&limit=1`;

  const response = await fetch(url, {
    headers: NOMINATIM_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!response.ok) return null;

  const results: any[] = await response.json();
  if (!results.length) return null;

  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
  };
}

// ─── Polyline decoder (Google / ORS encoded format) ───────────────────────────

/**
 * Decode a Google-encoded polyline string to an array of { lat, lng } points.
 * ORS uses the same encoding algorithm (5-decimal precision) by default.
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
      shift  += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;

    shift  = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift  += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}
