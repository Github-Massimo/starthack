# Jungfrau Wallet MVP

Closed-loop tourism wallet prototype for the Jungfrau Region challenge.

## Product

Guests top up once through a lower-cost rail, pay for local experiences directly from wallet balance, and let the Jungfrau Region settle partners later in batches. The MVP now uses a points ledger with 2% cashback on in-app payments, 10% hotel booking rewards, and extra sustainability bonus points for lower-impact choices.

The demo now includes role-based account logic:
- Guest accounts can top up and pay.
- Guest accounts can also pay merchant-generated store QR requests from the account page.
- Partner company accounts can only see their own company payments, publish new experiences, generate store QR requests, track pending settlement totals, and view available settled funds.
- Ops accounts can create and settle payout batches.

## UX Direction

- Mobile-first wallet shell
- Rounded grayscale cards inspired by Gnosis Pay style interfaces
- Bottom tab navigation
- Wallet balance home
- Searchable marketplace with category filters, featured deals, and discovery list
- Store QR payment flow for direct partner checkout
- Partner-side experience publishing flow
- Direct wallet payment for experiences
- Role-based sign-in for guest, company, and ops views
- Settlement ops view

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
