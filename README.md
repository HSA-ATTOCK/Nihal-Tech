## Nihal Tech

Full-stack Next.js 16 app for device repairs and e-commerce. Includes customer storefront, cart/checkout, bookings, profile, and admin dashboards for orders, products, questions, and users. Prisma + Postgres, NextAuth, Cloudinary, and tailored API routes power the experience.

## Stack
- Next.js App Router (Turbopack), TypeScript, Tailwind
- Prisma ORM with Postgres
- NextAuth credentials + email flows
- Cloudinary uploads, custom email templates

## Getting started
1) Install deps
```bash
npm install
```
2) Copy env template and fill values
```bash
cp .env.example .env   # if you have one; otherwise create .env manually
```
Required keys (examples):
- DATABASE_URL=postgres://...
- NEXTAUTH_SECRET=...
- EMAIL_USER=...
- EMAIL_PASS=...
- CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud>

3) Generate client & run dev server
```bash
npx prisma generate
npm run dev
```

4) Run checks
```bash
npm run lint
npm run build
```

## Scripts
- dev: start Next.js in dev mode
- build: production build
- start: run the built app
- lint: lint with eslint

## Project map (high-level)
- app/: routes (public, auth, admin), API handlers, UI pages
- components/: shared UI (Navbar, Button, ProductCard, etc.)
- lib/: prisma client, mailer, cloudinary, error reporter
- prisma/: schema and migrations
- public/: static assets

## Notes
- Admin pages live under /admin (orders, products, questions, users)
- Customer flows cover shop, cart, checkout, bookings, profile, wishlist, orders with returns/reviews
- API routes handle auth, products, cart, checkout, orders, returns, reviews, wishlist, contact, etc.
