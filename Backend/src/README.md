# Backend Source

`src/` contains the API runtime code.

## Files
- `index.js`: Express setup, middleware registration, route mounting.

## Folders
- `middleware/`: shared auth and role guards.
- `routes/`: feature routes (`auth`, `inventory`, `orders`).

## Request Flow
1. Request enters Express.
2. Route-level middleware validates token and role when required.
3. Route handler executes Prisma operations.
4. JSON response is returned to frontend.
