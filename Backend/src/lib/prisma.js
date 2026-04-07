// Shared Prisma client so the API reuses one database connection pool.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__videoShoppePrisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__videoShoppePrisma = prisma;
}
