import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { agents } from "@/db/schema"
import { getAgentFromRequest } from "@/lib/agent-auth"
import { eq } from "drizzle-orm"

export async function PATCH(req: NextRequest) {
  const agent = await getAgentFromRequest(req)
  if (!agent) return NextResponse.json({ error: "invalid token" }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "body required" }, { status: 400 })
  const allowed = ["state", "task", "detail"] as const
  const updates: Record<string, unknown> = { lastActivityAt: new Date() }
  for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k]
  const [updated] = await db.update(agents).set(updates).where(eq(agents.id, agent.id)).returning()
  return NextResponse.json({ agent: updated })
}

export async function GET(req: NextRequest) {
  const agent = await getAgentFromRequest(req)
  if (!agent) return NextResponse.json({ error: "invalid token" }, { status: 401 })
  return NextResponse.json({ agent })
}
