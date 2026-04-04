/**
 * API Route: GET /api/geocode?address=...
 *
 * Geocodes a text address to lat/lng using Nominatim (OpenStreetMap).
 * No API key needed – completely free.
 */

import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/routing';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address')?.trim() ?? '';

    if (!address) {
      return NextResponse.json({ coords: null });
    }

    const coords = await geocodeAddress(address);
    return NextResponse.json({ coords });
  } catch (error: any) {
    console.error('Geocode error:', error);
    return NextResponse.json({ coords: null });
  }
}
