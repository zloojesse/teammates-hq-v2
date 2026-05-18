import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL required")
  const client = postgres(url, { max: 1 })

  const [{ exists }] = await client<{ exists: boolean }[]>`
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') AS exists
  `
  if (exists) {
    console.log("[migrate] schema already initialised (agents table present) — skipping")
    await client.end()
    return
  }

  console.log("[migrate] applying migrations…")
  const db = drizzle(client)
  await migrate(db, { migrationsFolder: "./drizzle" })
  console.log("[migrate] done")
  await client.end()
}

main().catch(async (e) => {
  console.error("[migrate] FAILED:", e)
  process.exit(1)
})
