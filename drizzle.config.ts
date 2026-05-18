import type { Config } from "drizzle-kit"
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://jesse@localhost:5432/teammates_hq",
  },
} satisfies Config
