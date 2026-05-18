import { createHash } from "node:crypto"
import { db } from "@/db"
import { agents } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function getAgentFromRequest(req: NextRequest | Request) {
  const auth = req.headers.get("authorization") || ""
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) return null
  const token = m[1].trim()
  const hash = hashToken(token)
  const [agent] = await db.select().from(agents).where(eq(agents.tokenHash, hash)).limit(1)
  return agent || null
}
