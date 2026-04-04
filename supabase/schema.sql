-- SmartRoute Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up all required tables.

-- ─── Enable UUID extension ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── preferences table ──────────────────────────────────────────────────────
-- Stores user route preferences (one row per user).
CREATE TABLE IF NOT EXISTS preferences (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type             TEXT NOT NULL DEFAULT 'car'
                             CHECK (vehicle_type IN ('car', 'bike', 'motorcycle', 'walking', 'transit')),
  travel_mode              TEXT NOT NULL DEFAULT 'DRIVING'
                             CHECK (travel_mode IN ('DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT')),
  avoid_traffic            BOOLEAN NOT NULL DEFAULT FALSE,
  prefer_shortest_time     BOOLEAN NOT NULL DEFAULT FALSE,
  prefer_shortest_distance BOOLEAN NOT NULL DEFAULT FALSE,
  bike_friendly            BOOLEAN NOT NULL DEFAULT FALSE,
  avoid_highways           BOOLEAN NOT NULL DEFAULT FALSE,
  avoid_tolls              BOOLEAN NOT NULL DEFAULT FALSE,
  dark_mode                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id) -- one preferences row per user
);

-- ─── saved_routes table ──────────────────────────────────────────────────────
-- Stores routes saved by users.
CREATE TABLE IF NOT EXISTS saved_routes (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  origin             TEXT NOT NULL,
  destination        TEXT NOT NULL,
  origin_coords      JSONB,  -- { lat: number, lng: number }
  destination_coords JSONB,  -- { lat: number, lng: number }
  route_data         JSONB NOT NULL,  -- full SmartRouteOption
  preferences        JSONB,  -- RoutePreferences snapshot at save time
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_preferences_user_id   ON preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_routes_user_id  ON saved_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_routes_created  ON saved_routes(created_at DESC);

-- ─── Row Level Security (RLS) ────────────────────────────────────────────────
-- Users can only read/write their own data.

ALTER TABLE preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;

-- Preferences policies
CREATE POLICY "Users can view own preferences"
  ON preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Saved routes policies
CREATE POLICY "Users can view own saved routes"
  ON saved_routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved routes"
  ON saved_routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved routes"
  ON saved_routes FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Auto-update updated_at trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_preferences_updated_at
  BEFORE UPDATE ON preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
