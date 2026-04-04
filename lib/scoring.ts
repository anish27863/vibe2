/**
 * SmartRoute Route Scoring Algorithm
 *
 * Updated for ORS stack:
 * - Road type distribution from ORS extras.waytype (no text inference needed)
 * - Traffic is SIMULATED via time-of-day + road type heuristic
 *   (ORS does not provide real-time traffic data like Google Maps)
 *
 * Scoring formula:
 *   score = (timeScore × timeW) + (trafficScore × trafficW)
 *         + (distanceScore × distW) + (roadTypeScore × roadW)
 *
 * Scores are 0–100. Higher = better route.
 */

import type {
  SmartRouteOption,
  RoutePreferences,
  RouteLabel,
  TrafficLevel,
  RoadTypeDistribution,
  VehicleType,
} from './types';

// ─── Route colour palette ─────────────────────────────────────────────────────

const ROUTE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ─── Traffic simulation ────────────────────────────────────────────────────────
//
// ORS does not provide real-time traffic data. We simulate it using:
//   1. Time of day (peak hours, night hours)
//   2. Road type (highways congest more during peak hours)
//   3. Vehicle type (bikes & walkers unaffected by road traffic)

function simulateTrafficDuration(
  durationSeconds:      number,
  roadDist:             RoadTypeDistribution,
  vehicleType:          VehicleType,
): number {
  // Bikes and walkers are not affected by road traffic
  if (vehicleType === 'bike' || vehicleType === 'walking') {
    return durationSeconds;
  }

  const hour    = new Date().getHours();
  const isPeak  = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  const isNight = hour >= 22 || hour <= 5;

  // Base multiplier
  let factor = isNight ? 1.05 : isPeak ? 1.35 : 1.18;

  // Highway routes congest more during peak hours
  if (isPeak && roadDist.highwayPercent > 30) {
    factor += 0.18;
  }

  // Local roads have steadier (lower) traffic
  if (roadDist.localPercent > 50) {
    factor *= 0.90;
  }

  return Math.round(durationSeconds * factor);
}

// ─── Traffic level from ratio ─────────────────────────────────────────────────

function computeTrafficLevel(
  duration:          number,
  durationInTraffic: number,
): TrafficLevel {
  const ratio = durationInTraffic / duration;
  if (ratio < 1.1)  return 'low';
  if (ratio < 1.3)  return 'moderate';
  if (ratio < 1.6)  return 'high';
  return 'very_high';
}

// ─── Normalise ────────────────────────────────────────────────────────────────

function normaliseInverse(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return ((max - value) / (max - min)) * 100;
}

const TRAFFIC_SCORE: Record<TrafficLevel, number> = {
  low:       100,
  moderate:  65,
  high:      30,
  very_high: 0,
};

// ─── Main scoring function ────────────────────────────────────────────────────

/**
 * Input: routes parsed from ORS (roadTypeDistribution already present).
 * Output: sorted array of fully-scored SmartRouteOption objects.
 */
export function scoreAndRankRoutes(
  routes: Omit<SmartRouteOption, 'score' | 'label' | 'scoreBreakdown' | 'color' | 'trafficLevel' | 'totalDurationInTraffic'>[],
  prefs:  RoutePreferences,
): SmartRouteOption[] {
  if (!routes || routes.length === 0) return [];

  // ── Step 1: Simulate traffic for each route ─────────────────────────────
  const enriched = routes.map((route) => {
    const totalDurationInTraffic = simulateTrafficDuration(
      route.totalDuration,
      route.roadTypeDistribution,
      prefs.vehicleType,
    );
    const trafficLevel = computeTrafficLevel(route.totalDuration, totalDurationInTraffic);

    return { ...route, totalDurationInTraffic, trafficLevel };
  });

  // ── Step 2: Min/max for normalisation ───────────────────────────────────
  const minTime     = Math.min(...enriched.map((r) => r.totalDurationInTraffic));
  const maxTime     = Math.max(...enriched.map((r) => r.totalDurationInTraffic));
  const minDistance = Math.min(...enriched.map((r) => r.totalDistance));
  const maxDistance = Math.max(...enriched.map((r) => r.totalDistance));

  // ── Step 3: Dynamic weights from preferences ─────────────────────────────
  let timeWeight     = 0.35;
  let trafficWeight  = 0.35;
  let distanceWeight = 0.15;
  let roadWeight     = 0.15;

  if (prefs.preferShortestTime) {
    timeWeight = 0.50; trafficWeight = 0.30; distanceWeight = 0.10; roadWeight = 0.10;
  }
  if (prefs.preferShortestDistance) {
    distanceWeight = 0.45; timeWeight = 0.25; trafficWeight = 0.20; roadWeight = 0.10;
  }
  if (prefs.avoidTraffic) {
    trafficWeight = 0.50; timeWeight = 0.30; distanceWeight = 0.10; roadWeight = 0.10;
  }
  if (prefs.bikeFriendly || prefs.vehicleType === 'bike') {
    roadWeight = 0.35; trafficWeight = 0.25; timeWeight = 0.25; distanceWeight = 0.15;
  }

  // ── Step 4: Score each route ─────────────────────────────────────────────
  const scored = enriched.map((route, idx) => {
    const timeScore     = normaliseInverse(route.totalDurationInTraffic, minTime, maxTime);
    const trafficScore  = TRAFFIC_SCORE[route.trafficLevel];
    const distanceScore = normaliseInverse(route.totalDistance, minDistance, maxDistance);

    const { highwayPercent, arterialPercent, localPercent, bikePathPercent } =
      route.roadTypeDistribution;

    let roadTypeScore = 50;
    if (prefs.vehicleType === 'car' || prefs.vehicleType === 'motorcycle') {
      roadTypeScore = highwayPercent * 1.0 + arterialPercent * 0.8
                    + localPercent   * 0.3 + bikePathPercent * 0.1;
    } else if (prefs.vehicleType === 'bike' || prefs.bikeFriendly) {
      roadTypeScore = bikePathPercent * 1.0 + localPercent * 0.9
                    + arterialPercent * 0.5 + highwayPercent * 0.05;
    } else if (prefs.vehicleType === 'walking') {
      roadTypeScore = bikePathPercent * 0.9 + localPercent * 1.0
                    + arterialPercent * 0.4 + highwayPercent * 0.0;
    }

    roadTypeScore = Math.min(100, Math.max(0, roadTypeScore));

    if (prefs.avoidHighways && highwayPercent > 20) roadTypeScore -= 40;

    const score =
      timeScore     * timeWeight    +
      trafficScore  * trafficWeight +
      distanceScore * distanceWeight +
      roadTypeScore * roadWeight;

    return {
      ...route,
      score:          Math.round(score * 10) / 10,
      scoreBreakdown: {
        timeScore:     Math.round(timeScore),
        trafficScore:  Math.round(trafficScore),
        distanceScore: Math.round(distanceScore),
        roadTypeScore: Math.round(roadTypeScore),
      },
      color: ROUTE_COLORS[idx % ROUTE_COLORS.length],
      label: 'Recommended' as RouteLabel,
    } as SmartRouteOption;
  });

  // ── Step 5: Sort descending ──────────────────────────────────────────────
  scored.sort((a, b) => b.score - a.score);

  // ── Step 6: Label assignment ─────────────────────────────────────────────
  return assignLabels(scored, prefs);
}

function assignLabels(routes: SmartRouteOption[], prefs: RoutePreferences): SmartRouteOption[] {
  const used = new Set<RouteLabel>();

  return routes.map((route, idx) => {
    let label: RouteLabel;

    if (idx === 0) {
      label = (prefs.bikeFriendly || prefs.vehicleType === 'bike')
        ? 'Bike Optimized'
        : (prefs.avoidTraffic && route.trafficLevel === 'low')
          ? 'Less Traffic'
          : 'Recommended';
    } else if (!used.has('Fastest') && route.scoreBreakdown.timeScore > 80) {
      label = 'Fastest';
    } else if (!used.has('Less Traffic') && route.trafficLevel === 'low') {
      label = 'Less Traffic';
    } else if (!used.has('Shortest') && route.scoreBreakdown.distanceScore > 70) {
      label = 'Shortest';
    } else if (!used.has('Eco Friendly') && route.roadTypeDistribution.localPercent > 40) {
      label = 'Eco Friendly';
    } else {
      label = 'Recommended';
    }

    used.add(label);
    return { ...route, label };
  });
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const hrs  = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs === 0)  return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function getTrafficColor(level: TrafficLevel): string {
  const colors: Record<TrafficLevel, string> = {
    low:       '#10b981',
    moderate:  '#f59e0b',
    high:      '#ef4444',
    very_high: '#dc2626',
  };
  return colors[level];
}

export function getLabelColor(label: RouteLabel): string {
  const colors: Record<RouteLabel, string> = {
    Fastest:          '#6366f1',
    'Less Traffic':   '#10b981',
    Shortest:         '#f59e0b',
    'Bike Optimized': '#06b6d4',
    'Eco Friendly':   '#22c55e',
    Recommended:      '#8b5cf6',
  };
  return colors[label] ?? '#6366f1';
}
