# Egypt Turkey Exchange Ledger

Production-ready MVP for a small currency exchange office. The system is ledger-based: financial movements are the source of truth, and customer balances are calculated from movement entries.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Decimal-safe calculations with `decimal.js`
- React Hook Form and Zod
- Single-admin cookie authentication
- Arabic RTL UI
- Customer statement PDF export

## Environment

Create `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/exchange_ledger?schema=public"
ADMIN_EMAIL=omar@admin.com
ADMIN_PASSWORD=omaradmin
AUTH_SECRET=random-long-secret
```

Use a longer random `AUTH_SECRET` in real deployment.

## Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000` and log in with the configured admin email and password.

## Ledger Convention

Balances are never typed manually. They are calculated from `FinancialMovement` rows.

- Positive balance: `مدين لنا`, the customer owes the office.
- Negative balance: `دائن علينا`, the office owes the customer.
- `RECEIVED`: money entered the office from the customer, so the customer balance decreases.
- `PAID`: money left the office to the customer, so the customer balance increases.
- `FEE`: MVP treats this as an amount the customer owes the office.
- `ADJUSTMENT`: signed manual correction. Positive increases what the customer owes; negative increases what the office owes.

Profit formulas live in `lib/calculations.ts`, and transaction status/profit refresh logic lives in `lib/ledger.ts`.
