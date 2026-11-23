import { PrismaClient } from '@prisma/client';

// One client (and one connection pool) shared by the whole API.
export const prisma = new PrismaClient();
