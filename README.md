# Scheduling App Monorepo

This monorepo contains:

- Web (Next.js + TailwindCSS)
- Mobile (Expo React Native)
- API (Node.js + Express + Prisma)

Auth via Clerk. DB via Supabase (PostgreSQL) using Prisma.

## Apps

- apps/web
- apps/mobile
- apps/api

## Commands

Use Node 22: `nvm use`

### Web

```
cd apps/web
cp .env.local.example .env.local  # fill Clerk keys
npm run dev
```

### Mobile

```
cd apps/mobile
cp .env.example .env               # set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
npm run ios | npm run android | npm run web
```

### API

```
cd apps/api
cp .env.example .env               # set DATABASE_URL, DIRECT_URL, Clerk keys
npx prisma migrate dev --name init
npm run dev
```

## Env

- Supabase connection strings go in `apps/api/.env`
- Clerk keys:
  - Web: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
  - API: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
  - Mobile: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
