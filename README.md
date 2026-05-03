This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Gharzaroor.pk - Karachi Shared Flats Marketplace

[![Next.js](https://img.shields.io/badge/next.js-16-green?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-4-purple?style=flat&logo=tailwind)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/supabase-%23CF568B?style=flat&logo=supabase)](https://supabase.com)

Production-ready marketplace for verified shared flats in Karachi. Features phone-verified owners, instant contact reveal, WhatsApp Quick Post, and privacy-first proxy.

Live: https://gharzaroor.pk

## Features
- ✅ Verified listings (phone + trust score)
- ✅ Quick Post (parse WhatsApp vacancy messages)
- ✅ Privacy Wall (proxy hides contacts until approved)
- ✅ Student-focused (KU, IBA, NED landmarks)
- ✅ Admin dashboard (trust_score >= 90)
- ✅ Responsive Tailwind v4 design
- ✅ Full TypeScript + Zod validation

## Tech Stack
| Frontend | Next.js 16 App Router, React 19, Tailwind v4, Framer Motion |
| Backend | Supabase Auth/DB/Storage/Edge Functions |
| Forms | React Hook Form + Zod |
| Deployment | Vercel (Turbopack)

## Setup

### Prerequisites
- Node.js 20+
- [Supabase Account](https://supabase.com) (free tier ok)

### 1. Clone & Install
```bash
git clone https://github.com/rohansoni786/gharzaroor.git
cd gharzaroor
npm install
```

### 2. Environment Variables
Copy `.env.example` → `.env.local`:
```bash
cp .env.example .env.local
```
Add your Supabase keys:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 3. Database Setup
```bash
npm run db:setup  # Runs seed.sql
```

### 4. Run Development
```bash
npm run dev
```
Open http://localhost:3000

### 5. Build & Production
```bash
npm run build     # Should pass 0 errors/warnings
npm run start
```

## Deployment (Vercel)
1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add Supabase env vars
4. Deploy!

## Project Structure
```
src/
├── app/          # App Router pages
├── components/   # Reusable UI (ListingCard, skeletons)
├── lib/          # Utils, constants, parseVacancy.ts
├── types/        # TypeScript definitions
└── supabase/     # seed.sql
```

## Local Development Workflow
1. `npm run dev` → http://localhost:3000
2. Edit → Turbopack HMR
3. `npm run lint` → Check code quality
4. `npm run build` → Verify production build

## Common Issues
| Issue | Fix |
|-------|-----|
| Supabase auth fail | Check `.env.local` keys |
| Build warnings | `npm run lint -- --fix` |
| Tailwind styles missing | Delete `.next`, restart dev |

## Contributing
1. Fork → Branch (`feat/your-feature`)
2. `npm run lint` before push
3. PR to `main` branch

## License
MIT

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
