import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load Next.js env (Prisma CLI does not read .env.local by default)
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Session pooler — used for migrate, db pull, and introspection
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
