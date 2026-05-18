import { db } from "@/db"
import { posts, users, agents, reactions } from "@/db/schema"
import { desc, inArray, sql, eq, and } from "drizzle-orm"
import { TopBar } from "@/components/top-bar"
import { Wall } from "@/components/wall"
import { RealtimeListener } from "@/components/realtime-listener"
import { getCurrentUser } from "@/lib/auth"
import { publicAgent } from "@/lib/agent-auth"

export const dynamic = "force-dynamic"

export default async function Home() {
  const me = await getCurrentUser()
  const rows = await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(50)

  const userIds = Array.from(new Set(rows.filter((r) => r.authorKind === "user").map((r) => r.authorId)))
  const agentIds = Array.from(new Set(rows.filter((r) => r.authorKind === "agent").map((r) => r.authorId)))
  const postIds = rows.map((r) => r.id)

  const [userRows, agentRows, allAgents, reactionCounts, myReactions] = await Promise.all([
    userIds.length ? db.select().from(users).where(inArray(users.id, userIds)) : Promise.resolve([]),
    agentIds.length ? db.select().from(agents).where(inArray(agents.id, agentIds)) : Promise.resolve([]),
    db.select().from(agents),
    postIds.length
      ? db
          .select({
            postId: reactions.postId,
            count: sql<number>`count(*)::int`.as("count"),
          })
          .from(reactions)
          .where(inArray(reactions.postId, postIds))
          .groupBy(reactions.postId)
      : Promise.resolve([] as { postId: string; count: number }[]),
    me && postIds.length
      ? db
          .select({ postId: reactions.postId })
          .from(reactions)
          .where(and(inArray(reactions.postId, postIds), eq(reactions.reactorId, me.id)))
      : Promise.resolve([] as { postId: string }[]),
  ])

  const userMap = new Map(userRows.map((u) => [u.id, u]))
  const agentMap = new Map(agentRows.map((a) => [a.id, publicAgent(a)]))
  const reactionMap = new Map(reactionCounts.map((r) => [r.postId, r.count]))
  const mySet = new Set(myReactions.map((r) => r.postId))

  const items = rows.map((p) => ({
    ...p,
    author: p.authorKind === "user" ? userMap.get(p.authorId) : agentMap.get(p.authorId),
    reactionCount: reactionMap.get(p.id) ?? 0,
    meLiked: mySet.has(p.id),
  }))

  return (
    <div className="flex min-h-dvh flex-col">
      <RealtimeListener />
      <TopBar me={me ?? undefined} agentCount={allAgents.length} />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 pt-5 pb-24">
        <Wall me={me ?? undefined} initialPosts={items} />
      </main>
    </div>
  )
}
