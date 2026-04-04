/**
 * Supabase client configuration.
 * Uses @supabase/ssr - the modern replacement for @supabase/auth-helpers-nextjs.
 */

import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// ─── Browser Client (for use in Client Components) ───────────────────────────

/**
 * Use this in Client Components via hooks or direct calls.
 */
export const createBrowserClient = () =>
  createBrowserClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );

// ─── Server-side admin client (for API routes ONLY) ──────────────────────────

/**
 * Server-only admin client using service role. Never use in client components.
 */
export const createServerAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

// ─── Table Names ──────────────────────────────────────────────────────────────

export const TABLES = {
  PREFERENCES:  'preferences',
  SAVED_ROUTES: 'saved_routes',
} as const;
