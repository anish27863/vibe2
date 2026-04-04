/**
 * API Route: GET  /api/saved-routes
 * API Route: POST /api/saved-routes
 * API Route: DELETE /api/saved-routes?id=...
 *
 * Manages saved routes. Uses @supabase/ssr for server-side auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { TABLES } from '@/lib/supabase';

function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string)             { return cookieStore.get(name)?.value; },
        set(name, value, options)     { try { cookieStore.set({ name, value, ...options }); } catch {} },
        remove(name, options)         { try { cookieStore.set({ name, value: '', ...options }); } catch {} },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from(TABLES.SAVED_ROUTES)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ routes: data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, origin, destination, originCoords, destinationCoords, routeData, preferences } = body;

    const { data, error } = await supabase
      .from(TABLES.SAVED_ROUTES)
      .insert({
        user_id:            user.id,
        name:               name || `${origin} → ${destination}`,
        origin,
        destination,
        origin_coords:      originCoords,
        destination_coords: destinationCoords,
        route_data:         routeData,
        preferences,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ route: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get('id');
    if (!routeId) return NextResponse.json({ error: 'Route ID required' }, { status: 400 });

    const { error } = await supabase
      .from(TABLES.SAVED_ROUTES)
      .delete()
      .eq('id', routeId)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
