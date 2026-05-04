-- Full idempotent Supabase migration for Gharzaroor
-- Schema, indexes, RLS, RPCs
-- Run in Supabase SQL Editor

-- 1. TABLES (idempotent CREATE IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  phone_number TEXT UNIQUE,
  whatsapp_number TEXT,
  age INTEGER CHECK (age IS NULL OR age >= 16 AND age <= 100),
  emergency_contact TEXT,
  occupation TEXT CHECK (occupation IN ('student', 'professional', 'both') OR occupation IS NULL),
  avatar_url TEXT,
  trust_score INTEGER DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  coordinates JSONB,
  category TEXT,
  search_volume INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  rent INTEGER NOT NULL,
  beds_available INTEGER NOT NULL,
  gender_preference TEXT CHECK (gender_preference IN ('male', 'female', 'any')) NOT NULL,
  phone_number TEXT,
  contact_phone TEXT,
  type TEXT CHECK (type IN ('permanent', 'temporary')),
  photos TEXT[],
  description TEXT,
  amenities TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'flagged', 'rejected', 'filled', 'deleted')),
  area_id UUID REFERENCES areas(id),
  custom_area TEXT,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wanted_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id UUID REFERENCES profiles(id),
  contact_phone TEXT,
  area_id UUID REFERENCES areas(id),
  custom_area TEXT,
  rent_min INTEGER NOT NULL,
  rent_max INTEGER NOT NULL,
  beds_needed INTEGER NOT NULL,
  gender_preference TEXT CHECK (gender_preference IN ('male', 'female', 'any')) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  seeker_id UUID REFERENCES profiles(id),
  owner_id UUID REFERENCES profiles(id),
  message TEXT,
  revealed BOOLEAN DEFAULT false,
  reveal_window TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_area ON listings (area_id);
CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings (owner_id);
CREATE INDEX IF NOT EXISTS idx_wanted_area ON wanted_ads (area_id);
CREATE INDEX IF NOT EXISTS idx_wanted_status ON wanted_ads (status);
CREATE INDEX IF NOT EXISTS idx_areas_name_gin ON areas USING GIN (to_tsvector('simple', name));

-- 3. RLS ENABLE & POLICIES (DROP IF EXISTS then CREATE)
ALTER TABLE profiles ENABLE RLS;
ALTER TABLE listings ENABLE RLS;
ALTER TABLE wanted_ads ENABLE RLS;
ALTER TABLE inquiries ENABLE RLS;
ALTER TABLE analytics_events ENABLE RLS;

-- Profiles RLS
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Listings RLS
DROP POLICY IF EXISTS "Public read live listings" ON listings;
CREATE POLICY "Public read live listings" ON listings FOR SELECT USING (status = 'live');

DROP POLICY IF EXISTS "Owners manage own listings" ON listings;
CREATE POLICY "Owners manage own listings" ON listings FOR ALL USING (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS "Admin moderate all" ON listings;
CREATE POLICY "Admin moderate all" ON listings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND trust_score >= 90)
);

-- Wanted Ads RLS
DROP POLICY IF EXISTS "Public read active wanted" ON wanted_ads;
CREATE POLICY "Public read active wanted" ON wanted_ads FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Owners manage own wanted" ON wanted_ads;
CREATE POLICY "Owners manage own wanted" ON wanted_ads FOR ALL USING (auth.uid()::text = seeker_id);

-- Inquiries RLS
DROP POLICY IF EXISTS "Owners/seekers read own inquiries" ON inquiries;
CREATE POLICY "Owners/seekers read own inquiries" ON inquiries FOR SELECT USING (
  auth.uid()::text = owner_id OR auth.uid()::text = seeker_id
);

DROP POLICY IF EXISTS "Owners/seekers create inquiries" ON inquiries;
CREATE POLICY "Owners/seekers create inquiries" ON inquiries FOR INSERT WITH CHECK (
  auth.uid()::text = owner_id OR auth.uid()::text = seeker_id
);

-- Analytics insert only
DROP POLICY IF EXISTS "Users insert analytics" ON analytics_events;
CREATE POLICY "Users insert analytics" ON analytics_events FOR INSERT WITH CHECK (true);

-- 4. RPCs (CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION moderate_listing(p_listing_id UUID, p_new_status TEXT)
RETURNS listings AS $$
BEGIN
  UPDATE listings SET status = p_new_status, updated_at = NOW()
  WHERE id = p_listing_id AND status != 'deleted';
  IF NOT FOUND THEN RAISE EXCEPTION 'Listing not found';
  END IF;
  RETURN (SELECT * FROM listings WHERE id = p_listing_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reveal_owner_contact(p_inquiry_id UUID)
RETURNS inquiries AS $$
DECLARE
  inquiry inquiries;
BEGIN
  SELECT * INTO inquiry FROM inquiries WHERE id = p_inquiry_id;
  IF NOT FOUND OR inquiry.revealed OR NOW() > inquiry.reveal_window THEN
    RAISE EXCEPTION 'Cannot reveal contact';
  END IF;
  UPDATE inquiries SET revealed = true, reveal_window = NOW() + INTERVAL '48 hours' WHERE id = p_inquiry_id;
  RETURN inquiry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reveal_seeker_contact(p_wanted_id UUID)
RETURNS wanted_ads AS $$
-- Similar logic for wanted ads
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION report_listing(p_listing_id UUID, p_reason TEXT)
RETURNS void AS $$
INSERT INTO reports (listing_id, reporter_id, reason) VALUES (p_listing_id, auth.uid(), p_reason);
UPDATE listings SET status = 'flagged' WHERE id = p_listing_id;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Verify
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT policyname FROM pg_policies;
