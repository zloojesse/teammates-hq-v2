import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getAgentFromRequest } from "@/lib/agent-auth"
import { getPresignedPut, makeKey, publicUrlFor, r2Configured } from "@/lib/r2"

const MAX_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/heic",
])

export async function POST(req: NextRequest) {
  if (!r2Configured()) {
    return NextResponse.json({ error: "uploads not configured" }, { status: 503 })
  }

  // Either logged-in user or bearer-token agent may upload
  const agent = await getAgentFromRequest(req)
  let actorId: string
  if (agent) {
    actorId = agent.id
  } else {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    actorId = me.id
  }

  const body = (await req.json().catch(() => null)) as
    | { filename?: string; contentType?: string; size?: number }
    | null
  if (!body?.filename || !body?.contentType) {
    return NextResponse.json({ error: "filename and contentType required" }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(body.contentType)) {
    return NextResponse.json({ error: "unsupported contentType" }, { status: 415 })
  }
  if (body.size != null && body.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (>10MB)" }, { status: 413 })
  }

  const key = makeKey(body.filename, actorId)
  const uploadUrl = await getPresignedPut(key, body.contentType, 60)
  return NextResponse.json({
    uploadUrl,
    key,
    publicUrl: publicUrlFor(key),
    expiresIn: 60,
  })
}
