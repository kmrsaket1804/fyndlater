# FyndLater

**Send it to Faye. Fynd it later.**

FyndLater is an AI memory assistant for everything people save but struggle to find later. Built on the [Next.js SaaS Starter](https://github.com/nextjs/saas-starter) template.

## Product

- **FyndLater (web app)** — Sign up, manage saves, and subscribe
- **Faye (Instagram assistant)** — Message Faye to save reels, posts, links, screenshots, and notes. Ask her later to find anything in natural language.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: Postgres + Drizzle ORM
- **Payments**: Stripe
- **UI**: Tailwind CSS + shadcn/ui

## Getting Started

```bash
pnpm install
pnpm db:setup   # Configure Postgres
pnpm db:migrate
pnpm db:seed    # Seed test user + Stripe products
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test credentials (after seeding)

- Email: `test@test.com`
- Password: `admin123`

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `POSTGRES_URL`
- `AUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `BASE_URL`

## Deploy

Deploy to [Vercel](https://vercel.com) and connect your Postgres and Stripe accounts.
