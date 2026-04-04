/**
 * API Route: POST /api/routes
 *
 * Secure proxy that calls OpenRouteService (ORS) Directions API server-side,
 * then applies the SmartRoute scoring algorithm.
 *
 * ORS API key is never exposed to the browser.
 * If coords are missing, Nominatim is used to geocode the addresses first.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchORSDirections, geocodeAddress } from '@/lib/routing';
import { scoreAndRankRoutes } from '@/lib/scoring';
import type { RoutePreferences, LatLng } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      origin,
      destination,
      originCoords      : rawOriginCoords,
      destinationCoords : rawDestCoords,
      preferences,
    } = body as {
      origin:            string;
      destination:       string;
      originCoords?:     LatLng | null;
      destinationCoords?: LatLng | null;
      preferences:       RoutePreferences;
    };

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ORS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Routing service not configured (missing ORS_API_KEY)' },
        { status: 500 }
      );
    }

    // ── Geocode if coordinates were not provided ──────────────────────────
    let originCoords: LatLng | null = rawOriginCoords ?? null;
    let destCoords:   LatLng | null = rawDestCoords ?? null;

    if (!originCoords) {
      originCoords = await geocodeAddress(origin);
    }
    if (!destCoords) {
      destCoords = await geocodeAddress(destination);
    }

    if (!originCoords || !destCoords) {
      return NextResponse.json(
        { routes: [], status: 'ZERO_RESULTS', error: 'Could not geocode one or both locations.' }
      );
    }

    // ── Fetch routes from ORS ─────────────────────────────────────────────
    const rawRoutes = await fetchORSDirections(
      {
        originCoords,
        destinationCoords: destCoords,
        vehicleType:   preferences?.vehicleType   ?? 'car',
        avoidHighways: preferences?.avoidHighways ?? false,
        avoidTolls:    preferences?.avoidTolls    ?? false,
      },
      apiKey,
    );

    if (!rawRoutes || rawRoutes.length === 0) {
      return NextResponse.json({ routes: [], status: 'ZERO_RESULTS' });
    }

    // ── Apply smart scoring ───────────────────────────────────────────────
    const scoredRoutes = scoreAndRankRoutes(rawRoutes, preferences ?? {
      avoidTraffic:           false,
      preferShortestTime:     false,
      preferShortestDistance: false,
      bikeFriendly:           false,
      avoidHighways:          false,
      avoidTolls:             false,
      vehicleType:            'car',
      travelMode:             'DRIVING',
    });

    return NextResponse.json({ routes: scoredRoutes, status: 'OK' });
  } catch (error: any) {
    console.error('Routes API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}
