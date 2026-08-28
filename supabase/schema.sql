-- =====================================================
-- ReelDash Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS PROFILE ───────────────────────────────────
-- Extends Supabase Auth's auth.users table
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  instagram_username TEXT UNIQUE,   -- links DMs to this Reeldash account
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REELS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reels (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shortcode       TEXT NOT NULL,                -- Instagram shortcode e.g. "ABC123xyz"
  url             TEXT NOT NULL,                -- Full Instagram URL
  thumbnail_url   TEXT,
  video_url       TEXT,
  caption         TEXT,
  creator_handle  TEXT,
  creator_name    TEXT,
  creator_avatar  TEXT,
  media_type      TEXT DEFAULT 'reel' CHECK (media_type IN ('reel', 'post', 'audio', 'story')),
  duration        TEXT,
  likes_count     TEXT,
  plays_count     TEXT,
  category        TEXT,
  tags            TEXT[],
  note            TEXT,
  is_favorite     BOOLEAN DEFAULT FALSE,
  ai_summary      TEXT,
  source          TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'dm', 'import')),  -- how it was saved
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, shortcode)   -- prevent duplicate saves
);

CREATE INDEX IF NOT EXISTS reels_user_id_idx ON public.reels(user_id);
CREATE INDEX IF NOT EXISTS reels_created_at_idx ON public.reels(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reels_media_type_idx ON public.reels(user_id, media_type);
CREATE INDEX IF NOT EXISTS reels_is_favorite_idx ON public.reels(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS reels_shortcode_idx ON public.reels(shortcode);

-- Full text search index
CREATE INDEX IF NOT EXISTS reels_fts_idx ON public.reels
  USING GIN(to_tsvector('english', COALESCE(caption, '') || ' ' || COALESCE(creator_handle, '') || ' ' || COALESCE(category, '') || ' ' || COALESCE(note, '')));

-- ─── COLLECTIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT DEFAULT '📁',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS collections_user_id_idx ON public.collections(user_id);

-- ─── REEL <> COLLECTION JUNCTION ─────────────────────
CREATE TABLE IF NOT EXISTS public.reel_collections (
  reel_id       UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (reel_id, collection_id)
);

-- ─── IG DM INGESTION TRACKING ────────────────────────
-- Tracks which Instagram sender IDs sent what, for deduplication
CREATE TABLE IF NOT EXISTS public.ig_dm_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ig_sender_id    TEXT NOT NULL,              -- Instagram user ID of the sender
  ig_sender_username TEXT,
  message_text    TEXT,
  shortcode       TEXT,
  reel_id         UUID REFERENCES public.reels(id),
  matched_user_id UUID REFERENCES auth.users(id),  -- which Reeldash user this mapped to
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'saved', 'no_match', 'error')),
  error_message   TEXT,
  received_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ig_dm_events_sender_idx ON public.ig_dm_events(ig_sender_id);
CREATE INDEX IF NOT EXISTS ig_dm_events_shortcode_idx ON public.ig_dm_events(shortcode);

-- ─── ROW LEVEL SECURITY ──────────────────────────────
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_dm_events    ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own profile
CREATE POLICY "profiles_self" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Reels: users own their reels
CREATE POLICY "reels_owner" ON public.reels
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Collections: users own their collections
CREATE POLICY "collections_owner" ON public.collections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reel-collections: user can manage entries for their own reels
CREATE POLICY "reel_collections_owner" ON public.reel_collections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.reels WHERE id = reel_id AND user_id = auth.uid())
  );

-- DM events: only service role can insert (webhook uses service key), users can read their own
CREATE POLICY "ig_dm_events_read" ON public.ig_dm_events
  FOR SELECT USING (matched_user_id = auth.uid());

-- ─── TRIGGERS: auto-update updated_at ────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reels_updated_at
  BEFORE UPDATE ON public.reels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
