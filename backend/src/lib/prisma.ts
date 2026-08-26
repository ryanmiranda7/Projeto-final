import { PrismaClient } from "@prisma/client";

// Evita criar múltiplas instâncias do PrismaClient durante o hot-reload
// do "tsx --watch" em desenvolvimento (isso esgotaria as conexões do
// banco rapidamente). Em produção, cria só uma instância normalmente.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
