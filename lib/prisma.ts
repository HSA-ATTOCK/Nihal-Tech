import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";
import path from "path";

// Load env explicitly from project root so compiled server chunks still find it
config({ path: path.resolve(process.cwd(), ".env"), override: false });

type GlobalPrisma = typeof globalThis & { prisma?: PrismaClient; pool?: Pool };
const globalForPrisma = globalThis as GlobalPrisma;

function createPrismaClient() {
  const raw = process.env.DATABASE_URL;

  if (!raw) {
    console.error(
      "DATABASE_URL is not set. Current env keys:",
      Object.keys(process.env).filter((k) => k.includes("DATABASE")),
    );
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Normalize postgres url prefix for pg
  const connectionString = raw.replace("postgresql://", "postgres://");

  console.log("Creating Prisma client with pg adapter...", {
    hasDbUrl: Boolean(connectionString),
    preview: connectionString.slice(0, 16),
  });

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: true },
  });

  const adapter = new PrismaPg(pool);
  return { prisma: new PrismaClient({ adapter }), pool };
}

let prisma: PrismaClient;
let pool: Pool;

if (!globalForPrisma.prisma || !globalForPrisma.pool) {
  const created = createPrismaClient();
  prisma = created.prisma;
  pool = created.pool;
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    globalForPrisma.pool = pool;
  }
} else {
  prisma = globalForPrisma.prisma;
  pool = globalForPrisma.pool;
}

export { prisma };
