import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { randomBytes } from "node:crypto"
import { getCurrentUser } from "@/lib/auth"
import { getAgentFromRequest } from "@/lib/agent-auth"
import { r2Configured, getPresignedPut, makeKey, publicUrlFor } from "@/lib/r2"

const MAX_BYTES = 25 * 1024 * 1024 // 25MB
const ALLOWED = /^(image|audio|video)\//

/**
 * Upload endpoint with two modes:
 *  - If R2 env vars are set → server proxies to R2 via presigned PUT and returns the public URL
 *  - Otherwise → writes to /public/uploads/ (dev fallback so the UI works end-to-end without keys)
 *
 * Accepts multipart/form-data with a single `file` field.
 */
export async function POST(req: NextRequest) {
  // Auth: agent (bearer) OR logged-in user
  const agent = await getAgentFromRequest(req)
  let actorId: string
  if (agent) {
    actorId = agent.id
  } else {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    actorId = me.id
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (>25MB)" }, { status: 413 })
  }
  if (!ALLOWED.test(file.type)) {
    return NextResponse.json({ error: `unsupported type: ${file.type}` }, { status: 415 })
  }

  const buf = Buffer.from(await file.arrayBuffer())

  if (r2Configured()) {
    const key = makeKey(file.name, actorId)
    const uploadUrl = await getPresignedPut(key, file.type, 120)
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: buf,
    })
    if (!put.ok) {
      return NextResponse.json({ error: `r2 put failed: ${put.status}` }, { status: 502 })
    }
    return NextResponse.json({
      url: publicUrlFor(key),
      type: file.type,
      name: file.name,
      size: file.size,
      storage: "r2",
    })
  }

  // Local fallback — writes under /public/uploads/<yyyymmdd>/<rand>.<ext>
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const ext = (file.name.split(".").pop() || file.type.split("/")[1] || "bin").toLowerCase().replace(/[^a-z0-9]/g, "")
  const rand = randomBytes(6).toString("hex")
  const dir = join(process.cwd(), "public", "uploads", stamp)
  await mkdir(dir, { recursive: true })
  const filename = `${rand}.${ext}`
  await writeFile(join(dir, filename), buf)
  return NextResponse.json({
    url: `/uploads/${stamp}/${filename}`,
    type: file.type,
    name: file.name,
    size: file.size,
    storage: "local",
  })
}
