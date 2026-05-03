-- Gharzaroor Fixes: Add contact_phone columns
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE listings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE wanted_ads ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- APPROVAL WORKFLOW & STATUSES (NEW)
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'live', 'flagged', 'rejected', 'filled', 'deleted'));

-- Update existing listings to 'live' (one-time)
UPDATE listings SET status = 'live' WHERE status IS NULL OR status = 'live';

-- OWNER STATUSES: Ensure RLS allows owners to update own status
-- (Assuming existing RLS: owners have ALL on own listings)

-- PROFILE ENHANCEMENTS
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age INTEGER 
CHECK (age IS NULL OR (age >= 16 AND age <= 100)),
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT 
CHECK (occupation IN ('student', 'professional', 'both') OR occupation IS NULL),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- MODERATE_LISTING RPC
CREATE OR REPLACE FUNCTION moderate_listing(p_listing_id UUID, p_new_status TEXT)
RETURNS listings
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  UPDATE listings 
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id = p_listing_id 
    AND status != 'deleted';  -- Prevent moderating deleted
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found or already deleted';
  END IF;
  
  RETURN (SELECT * FROM listings WHERE id = p_listing_id);
END;
$$;

-- AVATARS STORAGE POLICY (run after creating 'avatars' bucket)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- RLS: public read, owner write
CREATE POLICY \"Avatar public read\" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY \"Avatar owner write\" ON storage.objects
  FOR ALL USING (bucket_id = 'avatars' AND auth.uid()::text = owner)
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = owner);

-- Verify
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('age','emergency_contact','occupation','avatar_url');
-- SELECT * FROM listings LIMIT 1;  -- Check status default

