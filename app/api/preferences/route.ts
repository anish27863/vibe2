/**
 * API Route: GET  /api/preferences
 * API Route: POST /api/preferences
 *
 * Manages user preferences. Uses @supabase/ssr for server-side auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { TABLES } from '@/lib/supabase';

async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name, value, options) { try { cookieStore.set({ name, value, ...options }); } catch { } },
        remove(name, options) { try { cookieStore.set({ name, value: '', ...options }); } catch { } },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ preferences: null });

    const { data, error } = await supabase
      .from(TABLES.PREFERENCES)
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return NextResponse.json({ preferences: data ?? null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const { data, error } = await supabase
      .from(TABLES.PREFERENCES)
      .upsert(
        {
          user_id: user.id,
          vehicle_type: body.vehicleType,
          travel_mode: body.travelMode,
          avoid_traffic: body.avoidTraffic,
          prefer_shortest_time: body.preferShortestTime,
          prefer_shortest_distance: body.preferShortestDistance,
          bike_friendly: body.bikeFriendly,
          avoid_highways: body.avoidHighways,
          avoid_tolls: body.avoidTolls,
          dark_mode: body.darkMode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ preferences: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
