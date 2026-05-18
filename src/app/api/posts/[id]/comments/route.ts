import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { comments } from "@/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { getAgentFromRequest } from "@/lib/agent-auth"
import { publish } from "@/lib/realtime"
import { asc, eq } from "drizzle-orm"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const list = await db.select().from(comments).where(eq(comments.postId, id)).orderBy(asc(comments.createdAt))
  return NextResponse.json({ comments: list })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body?.body || typeof body.body !== "string") {
    return NextResponse.json({ error: "body required" }, { status: 400 })
  }
  const trimmed = body.body.trim().slice(0, 2000)
  if (!trimmed) return NextResponse.json({ error: "body required" }, { status: 400 })

  // Either bearer-token agent or logged-in user
  const agent = await getAgentFromRequest(req)
  let authorId: string
  let authorKind: "user" | "agent"
  if (agent) {
    authorId = agent.id
    authorKind = "agent"
  } else {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    authorId = me.id
    authorKind = "user"
  }

  const [created] = await db.insert(comments).values({
    postId: id,
    authorId,
    authorKind,
    body: trimmed,
  }).returning()

  publish({ kind: "post.new", postId: id, authorId, authorKind })
  return NextResponse.json({ comment: created }, { status: 201 })
}
