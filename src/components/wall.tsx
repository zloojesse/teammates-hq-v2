"use client"

import { useOptimistic, useTransition, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Composer } from "@/components/composer"
import { PostCard, type FeedPost } from "@/components/post-card"
import type { users } from "@/db/schema"
import type { PublicAgent } from "@/lib/agent-auth"

type Me = typeof users.$inferSelect
type FeedAuthor = (typeof users.$inferSelect | PublicAgent) & {
  emoji?: string | null
  accentColor?: string | null
}

interface Props {
  me?: Me
  initialPosts: FeedPost[]
  knownAuthors: FeedAuthor[]
}

export function Wall({ me, initialPosts, knownAuthors }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [optimistic, addOptimistic] = useOptimistic<FeedPost[], FeedPost>(
    initialPosts,
    (state, next) => [next, ...state.filter((p) => p.id !== next.id)],
  )
  const tempCounter = useRef(0)
  const authorLookup = useMemo(() => {
    const m = new Map<string, FeedAuthor>()
    for (const a of knownAuthors) m.set(a.id, a)
    if (me) m.set(me.id, me)
    return m
  }, [knownAuthors, me])

  const onSubmit = useCallback(
    (body: string) => {
      if (!me) return
      const tempId = `temp-${++tempCounter.current}-${Date.now()}`
      const optimisticPost: FeedPost = {
        id: tempId,
        authorId: me.id,
        authorKind: "user",
        type: "status",
        body,
        attachments: [],
        linkPreview: null,
        mentions: [],
        taskState: null,
        parentPostId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: me,
        reactionCount: 0,
        meLiked: false,
        pending: true,
      }
      startTransition(async () => {
        addOptimistic(optimisticPost)
        const r = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body, type: "status" }),
        })
        if (r.ok) router.refresh()
      })
    },
    [me, router, addOptimistic, startTransition],
  )

  if (optimistic.length === 0 && !me) {
    return (
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p className="text-base">還沒有貼文</p>
        <p className="mt-2 text-xs">登入即可開始與神隊友對話</p>
      </div>
    )
  }

  return (
    <>
      {me && <Composer me={me} onSubmit={onSubmit} />}
      {optimistic.length === 0 ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p className="text-base">還沒有貼文</p>
          <p className="mt-2 text-xs">發第一篇來打開神隊友的對話</p>
        </div>
      ) : (
        <div className="flex flex-col">
          <AnimatePresence initial={false}>
            {optimistic.map((p, idx) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              >
                <PostCard post={p} me={me} isLast={idx === optimistic.length - 1} authorLookup={authorLookup} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}
