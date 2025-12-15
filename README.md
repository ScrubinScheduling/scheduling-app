# README

course: CMPT 370 (https://www.notion.so/CMPT-370-262b470ff8ce81a6a2cee8e7ad9c742e?pvs=21)
mastery: none
progress: not started

## Scheduling App Monorepo

Web, Mobile, and API for a team scheduling app.

- Web: Next.js 15 + Tailwind
- Mobile: Expo (React Native)
- API: Node.js (Express) + Prisma (PostgreSQL)
- Auth: Clerk

---

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for local PostgreSQL) OR Supabase CLI (optional alternative)

---

## Quick start (local)

1. Clone and enter the repo

```bash
git clone https://git.cs.usask.ca/team-scooby/scheduling-app.git
cd scheduling-app
```

1. Start PostgreSQL (Docker)

```bash
docker compose up -d
```

### Clerk setup with screenshots

The following screenshots are referenced from `docs/images/`:

1. Create a Clerk account at [https://dashboard.clerk.com/sign-in](https://dashboard.clerk.com/sign-in)
2. Create application and get keys (view screenshots below)
    - Web and API will need the Secret Key. Web and Mobile need a Publishable Key.
    - Where to get them (Clerk dashboard → Configure → API keys):

![Clerk application settings and IDs](README/Screenshot_2025-12-02_at_2.54.04_PM.png)

![Clerk API keys for Web and API](README/Screenshot_2025-12-02_at_2.54.26_PM.png)

Clerk application creation

![Screenshot 2025-12-02 at 2.55.14 PM.png](README/Screenshot_2025-12-02_at_2.55.14_PM.png)

Copy Clerk API Keys posted on section 2 here and paste them in apps/web/.env file in the cloned repo locally

![Screenshot 2025-12-02 at 2.55.32 PM.png](README/Screenshot_2025-12-02_at_2.55.32_PM.png)

![Screenshot 2025-12-02 at 2.55.57 PM.png](README/Screenshot_2025-12-02_at_2.55.57_PM.png)

Copy the api keys here and paste them into apps/api/.env

![Screenshot 2025-12-02 at 2.56.34 PM.png](README/Screenshot_2025-12-02_at_2.56.34_PM.png)

Copy the api keys here and paste them into apps/mobile/.env

## Ngrok Setup

1. Create an ngrok account at [https://dashboard.ngrok.com/login](https://dashboard.ngrok.com/login)
2. Install and authenticate ngrok using instruction provided for your OS Platform
    
    

![ngrok install and auth token](README/Screenshot_2025-12-02_at_2.59.56_PM.png)

1. After that click on domains and copy that url

![ngrok dev domain management](README/Screenshot_2025-12-02_at_3.01.48_PM.png)

## Clerk Webhook Setup

1. Create a webhook endpoint
    - Clerk → Configure → Webhooks → Add Endpoint
    - Subscribe to at least `user.created` (you may also include `user.updated`, `user.deleted`)
    - Set URL to `https://<your-ngrok-domain>/clerk/webhook`
    - See screenshots below for assistance

![Create webhook endpoint and select user events](README/Screenshot_2025-12-02_at_3.03.05_PM.png)

![Screenshot 2025-12-02 at 3.03.33 PM.png](README/Screenshot_2025-12-02_at_3.03.33_PM.png)

![Screenshot 2025-12-02 at 3.05.01 PM.png](README/Screenshot_2025-12-02_at_3.05.01_PM.png)

![Screenshot 2025-12-02 at 3.05.45 PM.png](README/Screenshot_2025-12-02_at_3.05.45_PM.png)

Copy the the signing secret into the apps/api/.env like this `CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxx`

1. Create environment files BEFORE installing dependencies

The API runs Prisma on install, so make sure these files exist first.

- apps/api/.env

```

# Please check Clerk Setup to get these keys
CLERK_SECRET_KEY=sk_test_xxx 
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxx

# PostgreSQL
DATABASE_URL=postgresql://schedulinglocal:scooby@localhost:5432/schedulingdb
DIRECT_URL=postgresql://schedulinglocal:scooby@localhost:5432/schedulingdb

#Cors
FRONTEND_ORIGIN=http://localhost:3000,exp:<Metro bundler IP>:8081

# Server
PORT=4000
```

- apps/web/.env.local

```
# Please check Clerk Setup to get these keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# API base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

- apps/mobile/.env

```
# Please check Clerk Setup to get these keys
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

1. Install dependencies (workspace root)

```bash
pnpm install
```

1. Run the apps (in separate terminals)

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
```

1. Run `ngrok http —url=<ngrok-url> 4000` 

---

## Scripts reference

Root (`package.json`):

```json
"scripts": {  "dev:web": "pnpm -F web dev",  "dev:mobile": "pnpm -F mobile start",  "dev:api": "pnpm -F api dev",  "build": "turbo run build",  "build:web": "pnpm -F web build",  "build:api": "pnpm -F api build",  "postinstall": "pnpm -F api-client build; pnpm -F schemas build",  "build:api-client": "pnpm -F api-client build",  "db": "pnpm -F api db"}
```

API (`apps/api/package.json`):

```json
"scripts": {  "build": "tsc -p tsconfig.json",  "dev": "tsx watch src/index.ts",  "start": "node dist/index.js",  "seed": "tsx prisma/seed.ts",  "db": "pnpx supabase start",  "postinstall": "prisma generate  && prisma db push"}
```

Web (`apps/web/package.json`):

```json
"scripts": {  "dev": "next dev",  "build": "next build",  "start": "next start",  "lint": "eslint"}
```

Mobile (`apps/mobile/package.json`):

```json
"scripts": {  "start": "expo start --clear",  "android": "expo run:android",  "ios": "expo run:ios",  "web": "expo start --web --clear"}
```

---

## Useful URLs

- API: http://localhost:4000
- Web: http://localhost:3000
- Expo Dev Tools: printed in terminal when running `pnpm dev:mobile`

---

## Project structure

- apps/
    - api/ — Express + Prisma
    - web/ — Next.js app (Clerk SSR + middleware)
    - mobile/ — Expo app
- packages/
    - api-client/ — typed API client wrapper used by Web/Mobile
    - schemas/ — shared schema/types

---