# Biblio System Frontend

React + TypeScript single-page app for the
[biblio-system-rust](https://github.com/mahmoudadel810/biblio-system-rust)
Library Management System API.

## Stack

- **React 18** with **TypeScript**
- **Vite** dev server and build
- **React Router** for routing
- Plain CSS, no UI framework

## Features

- Email/password auth with automatic access-token refresh
- Member view: personal dashboard (loans, reservations, fines, unread
  notifications), catalog search with reservations, notifications
- Staff view: loan desk (borrow / return / renew), member administration,
  multi-branch transfers, procurement (suppliers and purchase orders),
  inventory stock-takes and adjustments, fine payment collection with a
  payment ledger, reports and statistics
- Admin-only: library settings, audit log

## Run locally

```bash
cp .env.example .env   # point VITE_API_URL at the running API
npm install
npm run dev            # http://localhost:5173
```

Build for production:

```bash
npm run build          # type-checks with tsc, then bundles into dist/
npm run preview
```

## Layout

```
src/
  main.tsx          entrypoint
  App.tsx           routes with role guards
  api/client.ts     fetch wrapper (bearer token + one-shot refresh)
  api/types.ts      API response types
  auth/             auth context and session handling
  components/       layout and route guards
  pages/            one page per feature area
```
