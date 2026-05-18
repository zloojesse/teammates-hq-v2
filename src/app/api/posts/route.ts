import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { desc } from "drizzle-orm"

export async function GET() {
  const list = await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(50)
  return NextResponse.json({ posts: list })
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body?.body || typeof body.body !== "string") {
    return NextResponse.json({ error: "body required" }, { status: 400 })
  }
  const [created] = await db.insert(posts).values({
    authorId: me.id,
    authorKind: "user",
    type: body.type || "status",
    body: body.body.slice(0, 4000),
    attachments: body.attachments || [],
  }).returning()
  return NextResponse.json({ post: created }, { status: 201 })
}
