# Prisma

Prisma schema and seed data for the backend.

## Files
- `schema.prisma`: datasource, enums, and models.
- `seed.js`: seed inventory records.

## Core Models
- `User`: account identity and role (`CUSTOMER`, `EMPLOYEE`, `OWNER`).
- `Inventory`: DVD records and stock counts.
- `Order`: checkout header linked to user.
- `OrderItem`: per-DVD checkout line items with `RENTAL` or `PURCHASE` type.

## Typical Workflow
```bash
cd Backend
npm run db:generate
npm run db:push
npm run seed
```
