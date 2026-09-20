-- ══════════════════════════════════════════════════════════════
-- Naatile Court — Database Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ══════════════════════════════════════════════════════════════

-- ─── 1. Evidence table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id     UUID REFERENCES cases(id) ON DELETE CASCADE,
  uploaded_by TEXT,
  file_url    TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- If the table already existed without uploaded_by, add it:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evidence' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE evidence ADD COLUMN uploaded_by TEXT;
  END IF;
END $$;

-- ─── 2. Votes table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id    UUID REFERENCES cases(id) ON DELETE CASCADE,
  vote       TEXT NOT NULL CHECK (vote IN ('guilty', 'not_guilty')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. Verdicts table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS verdicts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id       UUID REFERENCES cases(id) ON DELETE CASCADE,
  verdict       TEXT NOT NULL,
  reasoning     TEXT,
  fictional_law TEXT,
  punishment    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. RLS policies (permissive for this fun app) ──────────
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all evidence" ON evidence;
CREATE POLICY "Allow all evidence" ON evidence
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all votes" ON votes;
CREATE POLICY "Allow all votes" ON votes
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE verdicts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all verdicts" ON verdicts;
CREATE POLICY "Allow all verdicts" ON verdicts
  FOR ALL USING (true) WITH CHECK (true);

-- ─── 5. Defendant statement columns on cases table ──────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'defendant_statement'
  ) THEN
    ALTER TABLE cases ADD COLUMN defendant_statement TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'defendant_responded'
  ) THEN
    ALTER TABLE cases ADD COLUMN defendant_responded BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ─── 6. Storage bucket for evidence files ───────────────────
-- The bucket 'evidence-files' should already exist.
-- If not, create it in Dashboard → Storage → New Bucket
-- Name: evidence-files, Public: ON
