# Gharzaroor Feature Implementation TODO
Status: [IN PROGRESS]

## 1. Database Migrations (Supabase SQL Editor - MANUAL)
- [ ] Run appended migrations.sql (statuses, profiles columns, moderate_listing RPC)
- [ ] Create 'avatars' storage bucket + RLS policy (public read)
- [    ] Enable Google OAuth in Supabase → Providers → Google (manual: ClientID/Secret from Google Console)

## 2. Code Changes (BLACKBOXAI handling)
- [ ] Update types/index.ts (extend statuses, profiles fields) ✅
- [ ] Append src/supabase/migrations.sql ✅
- [✅] post-listing/page.tsx: status='pending'
- [✅] admin/page.tsx: Add Pending tab + RPC calls
- [✅] dashboard/page.tsx: Owner status dropdown (filled/delete)
- [✅] listings/[id]/page.tsx: Status messages, owner delete
- [✅] account/page.tsx: Full profile form + avatar upload
- [ ] AuthModal.tsx: Google OAuth button
- [ ] layout.tsx/page.tsx: Post-auth redirect from localStorage
- [ ] Verify listings/page.tsx, map, FeaturedListings filter 'live'

## 3. Testing & Final
- [ ] `npm run lint && npm run build` (0 errors)
- [ ] Test full flow: pending → approve → live; owner controls; Google; profile avatar
- [ ] Update TODO with completions
- [ ] attempt_completion

Next step: types + migrations
