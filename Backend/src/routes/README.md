# Backend Routes

Feature-oriented Express route files mounted in `src/index.js`.

## Current Route Files
- `auth.js`
  - Register/login
  - Get current user
  - Owner-only employee account list/detail
- `inventory.js`
  - Inventory list/detail
  - Owner-only inventory write actions
- `orders.js`
  - Authenticated checkout
  - Customer order history
  - Employee/owner recent customer orders

## Protection Model
- Public reads where needed for catalog display.
- JWT-based `requireAuth` for protected actions.
- `requireRole` for owner/employee capability boundaries.
