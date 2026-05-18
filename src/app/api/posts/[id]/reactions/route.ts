import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reactions } from "@/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { and, eq } from "drizzle-orm"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { id } = await params
  const { emoji = "♥" } = (await req.json().catch(() => ({}))) as { emoji?: string }
  await db.insert(reactions).values({ postId: id, reactorId: me.id, reactorKind: "user", emoji }).onConflictDoNothing()
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { id } = await params
  const emoji = new URL(req.url).searchParams.get("emoji") || "♥"
  await db.delete(reactions).where(and(eq(reactions.postId, id), eq(reactions.reactorId, me.id), eq(reactions.emoji, emoji)))
  return NextResponse.json({ ok: true })
}
