# Hussain Perfumes

A full-stack luxury perfume e-commerce platform: a NestJS REST API backed by
PostgreSQL/Prisma, and a Next.js storefront with a built-in admin dashboard.

## Quick Start (for testers)

Want to just run this on your own computer and click around? Follow these
exactly, in order.

**You'll need:** [Node.js 20+](https://nodejs.org) and a free
[Neon](https://neon.tech) Postgres database (takes ~1 minute to create — sign
up, click "New Project", then copy the connection string it shows you).

```bash
# 1. Get the code
git clone https://github.com/khadeejah56/Hussain_Perfume_website.git
cd Hussain_Perfume_website

# 2. Enable pnpm and install dependencies
corepack enable
pnpm install
```

**3. Create your environment files.** Create three files with this content
(paste it as-is, just replace `DATABASE_URL` with the connection string Neon
gave you):

`.env`, `apps/api/.env`, and `apps/web/.env.local` — all three need the
content from `.env.example` in the repo root. The quickest way:
```bash
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```
Then open each of those three files and replace the `DATABASE_URL` line with
your real Neon connection string. Everything else can stay as-is for local
testing.

```bash
# 4. Set up the database (creates tables + an admin account + a sample product)
pnpm db:migrate
pnpm db:seed

# 5. Run it
pnpm dev
```

Open **http://localhost:3000** in your browser — that's the storefront.

- **Admin login:** `hussainirshad5432@gmail.com` / `ChangeMe123!` (or just
  register your own account with "Register" to test as a regular customer)
- **API docs:** http://localhost:4000/api/docs

## Features

**Storefront**
- Product browsing with category/gender/concentration/price filters, search, sorting
- Product detail pages with image gallery, size/variant picker, notes, reviews
- Cart, checkout (address book, coupon codes, multiple payment methods), order history
- Wishlist, customer accounts, profile/password/email management

**Admin dashboard** (`/admin`, role-gated)
- Dashboard with sales, order, and returns KPIs
- Product management: create/edit/delete, variants, image upload
- Order management: status updates, payment status, manual dispatch (courier +
  tracking number)
- Site settings (e.g. the shipping announcement banner text)

**Backend**
- JWT auth (access + refresh tokens), role-based access control
- Products, categories, cart, coupons, orders, reviews, addresses, wishlist,
  uploads (Cloudinary), site settings
- Swagger API docs at `/api/docs`

Pricing is in PKR (Rs).

## Tech Stack

| Layer     | Stack |
|-----------|-------|
| Frontend  | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion |
| Backend   | NestJS 10, Prisma 6, PostgreSQL |
| Auth      | JWT (access + refresh), bcrypt |
| Images    | Cloudinary |
| Monorepo  | pnpm workspaces + Turborepo |

## Project Structure

```
apps/
  api/            NestJS REST API
  web/            Next.js storefront + admin dashboard
packages/
  database/       Prisma schema, client, seed script
  config/         Shared TypeScript config
```

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 11+
- A PostgreSQL database (a free [Neon](https://neon.tech) instance works well)

### 1. Install dependencies
```bash
pnpm install
```

### 2. Configure environment variables
Copy `.env.example` to three places and fill in real values:
```bash
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```
At minimum, set `DATABASE_URL` to your Postgres connection string. The JWT
secrets should be long random strings in any real deployment.

### 3. Set up the database
```bash
pnpm db:migrate   # applies Prisma migrations
pnpm db:seed      # creates an admin account, sample categories, and a product
```

### 4. Run the app
```bash
pnpm dev
```
This starts both apps via Turborepo:
- API: http://localhost:4000/api (Swagger docs at `/api/docs`)
- Web: http://localhost:3000

### Default admin login (from the seed script)
- Email: `hussainirshad5432@gmail.com`
- Password: `ChangeMe123!`

**Change this password after your first deployment.**

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run API + web in development |
| `pnpm build` | Build all apps |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Run across all apps |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Seed the database |
| `pnpm db:studio` | Open Prisma Studio |

## Deployment

The database (Neon) is already cloud-hosted. To put the app live:

- **API** (`apps/api`) — deploy to any Node host (Render, Railway, Fly.io).
  Build command: `pnpm install && pnpm --filter @hussain/api build`.
  Start command: `pnpm --filter @hussain/api start`.
  Set the same environment variables as `.env`, plus `CORS_ORIGIN` pointing at
  your deployed web URL.

- **Web** (`apps/web`) — deploy to Vercel with the project root set to
  `apps/web`. Set `NEXT_PUBLIC_API_URL` to your deployed API's `/api` URL and
  `NEXT_PUBLIC_SITE_URL` to your deployed web URL.

Cloudinary credentials are optional — without them, admin image upload falls
back to pasting an image URL directly.
