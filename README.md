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

## Auth & Payments

- **Login portal:** `/login` (sign in / sign up tabs)
- **Payments:** Cashfree (INR) for Pro plan upgrades
- Legacy Stripe routes remain but pricing uses Cashfree

### Cashfree env vars

```
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENVIRONMENT=sandbox
NEXT_PUBLIC_CASHFREE_ENVIRONMENT=sandbox
```

Add the webhook URL in Cashfree dashboard: `{BASE_URL}/api/cashfree/webhook`

## Deploy

Deploy to [Vercel](https://vercel.com) and connect your Postgres and Stripe accounts.
