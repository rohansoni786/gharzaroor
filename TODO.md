## TODO: Fix Auth Redirect Loop in Gharzaroor.pk

### Approved Plan Steps:
- [x] Step 1: Edit `src/proxy.ts` with official Supabase SSR cookie handling pattern (preserve public paths, static checks, admin logic).
- [x] Step 2: Run `npm run build` to verify no build errors.
- [ ] Step 3: Test login flow (visit /listings → login → no redirect loop).
- [ ] Step 4: Update TODO.md with completion status.
- [ ] Step 5: attempt_completion with summary.

