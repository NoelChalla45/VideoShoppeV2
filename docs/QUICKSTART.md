# Video Shoppe Quick Start

## Prerequisites
- Node.js 18+
- npm 9+
- Git

## Install and Run
```bash
git clone <your-repo-url>
cd Video_Shoppe
npm run setup
npm start
```

Open:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Default User Flow
1. Register as a customer from `/login`.
2. Browse DVDs in `/catalog`.
3. Add rent/buy items from DVD detail page.
4. Checkout in `/cart` with phone number and address.
5. View order activity in `/account`.
6. View due-soon and overdue rentals in `/alerts`.

## Employee and Owner Access
Role controls are database-driven.
- Employee routes: `/employee`, `/inventory`, `/customer-activity`
- Owner routes: `/owner`, `/owner/stock`, `/owner/inventory`, `/owner/employees`

## Current Behavior Notes
- Customer registration requires a name.
- Customer account activity and rental alerts are pulled from persisted backend orders.
- Employee customer activity supports selecting a customer first, then viewing their details and activity.

## Useful Commands
```bash
npm run verify
npm run frontend
npm run backend
npm run prisma:push
npm run prisma:studio
```

## Troubleshooting
- If schema errors appear, run:
```bash
cd Backend
npx prisma generate
npx prisma db push
```
- If ports are busy, stop old processes on `5000` and `5173`.
