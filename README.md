# Jungfrau Wallet MVP

Closed-loop tourism wallet prototype for the Jungfrau Region challenge.

## Product

Guests top up once through a lower-cost rail, pay for local experiences directly from wallet balance, and let the Jungfrau Region settle partners later in batches. The MVP also includes a simple payback system: guests earn 1 point for every CHF 100 paid.

The demo now includes role-based account logic:
- Guest accounts can top up and pay.
- Partner company accounts can only see their own company payments, pending settlement totals, and available settled funds.
- Ops accounts can create and settle payout batches.

## UX Direction

- Mobile-first wallet shell
- Rounded grayscale cards inspired by Gnosis Pay style interfaces
- Bottom tab navigation
- Wallet balance home
- Searchable marketplace with category filters, featured deals, and discovery list
- Direct wallet payment for experiences
- Role-based sign-in for guest, company, and ops views
- Settlement ops view

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
