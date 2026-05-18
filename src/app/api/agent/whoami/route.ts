import { NextRequest, NextResponse } from "next/server"
import { getAgentFromRequest } from "@/lib/agent-auth"
export async function GET(req: NextRequest) {
  const agent = await getAgentFromRequest(req)
  if (!agent) return NextResponse.json({ error: "invalid token" }, { status: 401 })
  return NextResponse.json({ slug: agent.slug, displayName: agent.displayName, agentId: agent.id, state: agent.state })
}
