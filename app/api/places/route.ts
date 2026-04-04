/**
 * API Route: GET /api/places?input=...
 *
 * Secure proxy for place autocomplete using Nominatim (OpenStreetMap).
 * No API key needed – completely free.
 *
 * Results include embedded coordinates so the client doesn't need
 * a separate geocoding call when the user selects a suggestion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchNominatimSearch } from '@/lib/routing';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get('input')?.trim() ?? '';

    if (input.length < 2) {
      return NextResponse.json({ predictions: [] });
    }

    const predictions = await fetchNominatimSearch(input);
    return NextResponse.json({ predictions, status: 'OK' });
  } catch (error: any) {
    console.error('Places API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch places' },
      { status: 500 }
    );
  }
}
