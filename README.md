# Video Shoppe

Full-stack DVD rental and sales application with role-based access for customers, employees, and owners.

## Current Scope
- Customer accounts: browse catalog, add rent/buy items to cart, checkout with required phone/address, view account activity, and track due-soon/overdue rental alerts.
- Employee accounts: clock in/out, view stock, browse customer names, and drill into customer purchase/rental activity.
- Owner accounts: view owner dashboard, view stock page, manage full inventory stock, view employee accounts and details.

## Tech Stack
- Frontend: React 18, Vite, React Router
- Backend: Node.js, Express, Prisma
- Database: PostgreSQL
- Auth: JWT, bcryptjs

## Quick Start
```bash
git clone <your-repo-url>
cd Video_Shoppe
npm run setup
npm start
```

Frontend runs at `http://localhost:5173`.
Backend runs at `http://localhost:5000`.

## Commands
| Command | Description |
|---|---|
| `npm run setup` | Install root, frontend, and backend dependencies |
| `npm start` | Start frontend and backend together |
| `npm run frontend` | Start frontend only |
| `npm run backend` | Start backend only |
| `npm run verify` | Run project verification script |
| `npm run prisma:push` | Apply Prisma schema changes |
| `npm run prisma:studio` | Open Prisma Studio |

## Role Behavior
- `CUSTOMER`: `/home`, `/catalog`, `/catalog/:id`, `/cart`, `/account`, `/alerts`
- `EMPLOYEE`: `/employee`, `/inventory`, `/customer-activity`, `/catalog`
- `OWNER`: `/owner`, `/owner/stock`, `/owner/inventory`, `/owner/employees`, `/catalog`

## Notes
- New self-registered accounts default to `CUSTOMER`.
- New account registration requires a name.
- Owner and employee roles should be assigned in the database.
- Inventory stock updates are owner-only via the Owner Inventory page and protected backend routes.
- Customer account activity and rental alerts are derived from persisted backend orders.

## Documentation
- [Quickstart](docs/QUICKSTART.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Organization Summary](docs/ORGANIZATION_SUMMARY.md)
- [Backend Overview](Backend/README.md)
- [Frontend Overview](Frontend/React/README.md)
