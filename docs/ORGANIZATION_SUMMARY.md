# Organization Summary

The repository is organized by runtime concern:

- `Backend/`: API server, Prisma schema, role-protected routes.
- `Frontend/React/`: SPA pages for customer, employee, and owner experiences.
- `scripts/`: setup and verification automation.
- `docs/`: project-level documentation.
- `Documents/`: planning and analysis source documents.

## Key Role Split
- Customer: shopping, account activity, checkout contact info, and rental alerts.
- Employee: operations view (clock, stock visibility, customer lookup, customer activity visibility).
- Owner: governance and management views (stock and employee account management).

## Source of Truth
- Inventory levels: backend database.
- Orders and checkout: backend transactional endpoints.
- Auth and role permissions: JWT + backend middleware.
- Customer account history and rental alerts: backend orders.
