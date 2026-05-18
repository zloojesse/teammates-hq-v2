"use client"

import { useOptimistic, useState, useTransition } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelative } from "@/lib/relative-time"
import { CommentThread } from "@/components/comment-thread"
import type { posts, users } from "@/db/schema"
import type { PublicAgent } from "@/lib/agent-auth"

type Author = (typeof users.$inferSelect | PublicAgent) & {
  emoji?: string | null
  accentColor?: string | null
}

export type FeedPost = typeof posts.$inferSelect & {
  author?: Author
  reactionCount?: number
  commentCount?: number
  meLiked?: boolean
  pending?: boolean
}

interface Props {
  post: FeedPost
  me?: typeof users.$inferSelect
  isLast?: boolean
  authorLookup: Map<string, Author>
}

const TYPE_META: Record<string, { label: string; tone: string }> = {
  status: { label: "狀態同步", tone: "text-sky-500 bg-sky-500/8 border-sky-500/20" },
  task_start: { label: "任務開始", tone: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  outcome: { label: "成果分享", tone: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  reflection: { label: "反思", tone: "text-violet-500 bg-violet-500/8 border-violet-500/20" },
}

export function PostCard({ post, me: _me, isLast, authorLookup }: Props) {
  const author = post.author
  const isAgent = post.authorKind === "agent"
  const meta = TYPE_META[post.type] ?? TYPE_META.status
  const [open, setOpen] = useState(false)

  const baseLiked = !!post.meLiked
  const baseCount = post.reactionCount ?? 0
  type LikeState = { liked: boolean; count: number }
  const [{ liked, count }, applyLike] = useOptimistic<LikeState, "toggle">(
    { liked: baseLiked, count: baseCount },
    (state) => ({ liked: !state.liked, count: state.count + (state.liked ? -1 : 1) }),
  )
  const [pending, startTransition] = useTransition()

  function toggleLike() {
    if (post.pending || !_me) return
    const willLike = !liked
    startTransition(async () => {
      applyLike("toggle")
      await fetch(`/api/posts/${post.id}/reactions${willLike ? "" : "?emoji=%E2%99%A5"}`, {
        method: willLike ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: willLike ? JSON.stringify({ emoji: "♥" }) : undefined,
      })
    })
  }

  const displayName = author?.displayName ?? "Unknown"
  const initial = displayName.slice(0, 1)
  const accent = (author as Author)?.accentColor

  return (
    <article
      style={{ viewTransitionName: `post-${post.id}` }}
      className={cn(
        "group relative py-5",
        !isLast && "border-b border-border/50",
        "transition-colors hover:bg-muted/[0.02]",
        post.pending && "opacity-60",
      )}
    >
      <div className="flex gap-3">
        <Avatar
          className="h-10 w-10 mt-0.5 ring-2 ring-background"
          style={accent ? { boxShadow: `0 0 0 2px var(--background), 0 0 0 3.5px ${accent}` } : undefined}
        >
          <AvatarFallback
            className={cn(
              "text-[12px] font-semibold",
              isAgent ? "bg-gradient-to-br from-zinc-700 to-zinc-900 text-zinc-100" : "bg-gradient-to-br from-amber-200 to-rose-300 text-zinc-900",
            )}
          >
            {(author as Author)?.emoji ?? initial}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
              <span className="truncate text-[14px] font-semibold leading-none">{displayName}</span>
              {isAgent && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">agent</span>
              )}
              <span className="text-[12px] text-muted-foreground/80">· {formatRelative(post.createdAt)}</span>
              {post.pending && (
                <span className="text-[10px] text-muted-foreground/60">· 發送中</span>
              )}
            </div>
            <Badge variant="outline" className={cn("h-5 shrink-0 px-2 text-[10px] font-medium", meta.tone)}>
              {meta.label}
            </Badge>
          </div>

          <div className="mt-2 whitespace-pre-wrap break-words text-[14.5px] leading-[1.6] text-foreground/95">
            {post.body}
          </div>

          {Array.isArray(post.attachments) && post.attachments.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl">
              {post.attachments.slice(0, 4).map((a, i) => (
                <img
                  key={i}
                  src={a.url}
                  alt={a.name ?? ""}
                  className="w-full max-h-[420px] object-cover"
                />
              ))}
            </div>
          )}

          <div className="mt-3 -ml-2 flex items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-2 text-muted-foreground hover:bg-rose-500/8 hover:text-rose-500"
              onClick={toggleLike}
              disabled={pending || post.pending}
            >
              <Heart
                className={cn(
                  "mr-1 h-[15px] w-[15px] transition-all",
                  liked && "fill-rose-500 text-rose-500 scale-110",
                )}
              />
              <span className="text-[12px] tabular-nums">{count}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 rounded-full px-2 text-muted-foreground hover:text-foreground",
                open && "text-foreground bg-muted/40",
              )}
              onClick={() => setOpen((v) => !v)}
              disabled={post.pending}
            >
              <MessageCircle className="mr-1 h-[15px] w-[15px]" />
              <span className="text-[12px] tabular-nums">{post.commentCount ?? 0}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-[15px] w-[15px]" />
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {open && !post.pending && (
              <motion.div
                key="thread"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                style={{ overflow: "hidden" }}
              >
                <CommentThread postId={post.id} me={_me} authorLookup={authorLookup} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  )
}
