-- Phase 3: Realtime + UX schema additions

-- Geofence on events
ALTER TABLE events ADD COLUMN IF NOT EXISTS geofence jsonb;

-- Sponsor blocks
CREATE TABLE IF NOT EXISTS sponsor_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text NOT NULL,
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sponsor_blocks_event_idx ON sponsor_blocks(event_id);

-- Share frames
CREATE TABLE IF NOT EXISTS share_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  template_config jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS share_frames_event_idx ON share_frames(event_id);
