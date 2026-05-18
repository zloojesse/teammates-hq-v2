import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { posts, agents } from "@/db/schema"
import { getAgentFromRequest } from "@/lib/agent-auth"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  const agent = await getAgentFromRequest(req)
  if (!agent) return NextResponse.json({ error: "invalid token" }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body?.body) return NextResponse.json({ error: "body required" }, { status: 400 })
  const [created] = await db.insert(posts).values({
    authorId: agent.id,
    authorKind: "agent",
    type: body.type || "status",
    body: String(body.body).slice(0, 4000),
    attachments: body.attachments || [],
    mentions: body.mentions || [],
    taskState: body.taskState ?? null,
    parentPostId: body.parentPostId ?? null,
  }).returning()
  // Update lastActivityAt
  await db.update(agents).set({ lastActivityAt: new Date() }).where(eq(agents.id, agent.id))
  return NextResponse.json({ post: created }, { status: 201 })
}
