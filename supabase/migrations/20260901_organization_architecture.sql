-- =====================================================
-- REELDASH: Category, Hashtag & AI Organization Schema
-- =====================================================

-- 1. CATEGORIES TABLE (User-scoped library organization)
CREATE TABLE IF NOT EXISTS public.categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  name            TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  slug            TEXT NOT NULL,
  icon            TEXT DEFAULT '📁',
  description     TEXT,
  source          TEXT DEFAULT 'dm' CHECK (source IN ('user', 'dm', 'ai', 'system')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_normalized_category UNIQUE(user_id, normalized_name)
);

CREATE INDEX IF NOT EXISTS categories_user_id_idx ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS categories_normalized_name_idx ON public.categories(user_id, normalized_name);

-- 2. REEL_CATEGORIES JUNCTION (Many-to-Many Reel ↔ Category)
CREATE TABLE IF NOT EXISTS public.reel_categories (
  reel_id       UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (reel_id, category_id)
);

CREATE INDEX IF NOT EXISTS reel_categories_reel_id_idx ON public.reel_categories(reel_id);
CREATE INDEX IF NOT EXISTS reel_categories_category_id_idx ON public.reel_categories(category_id);

-- 3. HASHTAGS TABLE (Instagram Post Metadata)
CREATE TABLE IF NOT EXISTS public.hashtags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hashtags_normalized_name_idx ON public.hashtags(normalized_name);

-- 4. REEL_HASHTAGS JUNCTION (Many-to-Many Reel ↔ Hashtag)
CREATE TABLE IF NOT EXISTS public.reel_hashtags (
  reel_id       UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  hashtag_id   UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (reel_id, hashtag_id)
);

CREATE INDEX IF NOT EXISTS reel_hashtags_reel_id_idx ON public.reel_hashtags(reel_id);
CREATE INDEX IF NOT EXISTS reel_hashtags_hashtag_id_idx ON public.reel_hashtags(hashtag_id);

-- 5. Add ai_topics to reels if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reels' AND column_name = 'ai_topics'
  ) THEN
    ALTER TABLE public.reels ADD COLUMN ai_topics TEXT[] DEFAULT '{}'::text[];
  END IF;
END $$;

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_hashtags ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for webhook bot / API) and authenticated users access to own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'categories_user_policy' AND tablename = 'categories'
  ) THEN
    CREATE POLICY "categories_user_policy" ON public.categories
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'reel_categories_policy' AND tablename = 'reel_categories'
  ) THEN
    CREATE POLICY "reel_categories_policy" ON public.reel_categories
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'hashtags_policy' AND tablename = 'hashtags'
  ) THEN
    CREATE POLICY "hashtags_policy" ON public.hashtags
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'reel_hashtags_policy' AND tablename = 'reel_hashtags'
  ) THEN
    CREATE POLICY "reel_hashtags_policy" ON public.reel_hashtags
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 7. DATA MIGRATION: Populate categories and reel_categories from existing reels
DO $$
DECLARE
  r RECORD;
  cat_id UUID;
  clean_cat TEXT;
  norm_cat TEXT;
  slug_cat TEXT;
  tag TEXT;
  clean_tag TEXT;
  norm_tag TEXT;
  hash_id UUID;
BEGIN
  FOR r IN SELECT id, user_id, category, tags FROM public.reels LOOP
    -- Migrate category
    IF r.category IS NOT NULL AND TRIM(r.category) <> '' AND NOT (r.category LIKE '#%') THEN
      clean_cat := TRIM(r.category);
      norm_cat := LOWER(clean_cat);
      slug_cat := LOWER(REGEXP_REPLACE(clean_cat, '[^a-zA-Z0-9]+', '-', 'g'));

      INSERT INTO public.categories (user_id, name, normalized_name, slug, source)
      VALUES (r.user_id, clean_cat, norm_cat, slug_cat, 'system')
      ON CONFLICT (user_id, normalized_name) DO UPDATE SET updated_at = NOW()
      RETURNING id INTO cat_id;

      IF cat_id IS NULL THEN
        SELECT id INTO cat_id FROM public.categories WHERE user_id = r.user_id AND normalized_name = norm_cat LIMIT 1;
      END IF;

      IF cat_id IS NOT NULL THEN
        INSERT INTO public.reel_categories (reel_id, category_id)
        VALUES (r.id, cat_id)
        ON CONFLICT (reel_id, category_id) DO NOTHING;
      END IF;
    END IF;

    -- Migrate hashtags from tags array
    IF r.tags IS NOT NULL AND ARRAY_LENGTH(r.tags, 1) > 0 THEN
      FOREACH tag IN ARRAY r.tags LOOP
        clean_tag := TRIM(tag);
        IF clean_tag <> '' THEN
          norm_tag := LOWER(REGEXP_REPLACE(clean_tag, '^#+', ''));
          IF norm_tag <> '' THEN
            INSERT INTO public.hashtags (name, normalized_name)
            VALUES ('#' || norm_tag, norm_tag)
            ON CONFLICT (normalized_name) DO NOTHING
            RETURNING id INTO hash_id;

            IF hash_id IS NULL THEN
              SELECT id INTO hash_id FROM public.hashtags WHERE normalized_name = norm_tag LIMIT 1;
            END IF;

            IF hash_id IS NOT NULL THEN
              INSERT INTO public.reel_hashtags (reel_id, hashtag_id)
              VALUES (r.id, hash_id)
              ON CONFLICT (reel_id, hashtag_id) DO NOTHING;
            END IF;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;
