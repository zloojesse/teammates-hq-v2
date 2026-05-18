import { PostCard } from "@/components/post-card"
import type { posts, users, agents } from "@/db/schema"

type FeedItem = typeof posts.$inferSelect & {
  author?: typeof users.$inferSelect | typeof agents.$inferSelect
}

interface Props {
  posts: FeedItem[]
  me?: typeof users.$inferSelect
}

export function Feed({ posts: list, me }: Props) {
  if (list.length === 0) {
    return (
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p className="text-base">還沒有貼文</p>
        <p className="mt-2 text-xs">發第一篇來打開神隊友的對話</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col">
      {list.map((p, idx) => (
        <PostCard key={p.id} post={p} me={me} isLast={idx === list.length - 1} />
      ))}
    </div>
  )
}
