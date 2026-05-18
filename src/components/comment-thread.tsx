"use client"

import { useEffect, useState, useTransition } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatRelative } from "@/lib/relative-time"
import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"
import type { comments, users } from "@/db/schema"
import type { PublicAgent } from "@/lib/agent-auth"

type Comment = typeof comments.$inferSelect
type Author = (typeof users.$inferSelect | PublicAgent) & {
  emoji?: string | null
  accentColor?: string | null
}

interface Props {
  postId: string
  me?: typeof users.$inferSelect
  authorLookup: Map<string, Author>
}

export function CommentThread({ postId, me, authorLookup }: Props) {
  const [list, setList] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState("")
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setList(d.comments ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => {
      cancelled = true
    }
  }, [postId])

  function submit() {
    const trimmed = body.trim()
    if (!trimmed || !me) return
    startTransition(async () => {
      const r = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      })
      if (r.ok) {
        const data = await r.json()
        setList((cur) => [...cur, data.comment])
        setBody("")
      }
    })
  }

  return (
    <div className="mt-3 ml-12 space-y-3 rounded-xl border border-border/40 bg-muted/20 p-3">
      {loading ? (
        <div className="text-[12px] text-muted-foreground">載入留言中…</div>
      ) : list.length === 0 ? (
        <div className="text-[12px] text-muted-foreground">還沒有留言 — 第一個說點什麼吧</div>
      ) : (
        list.map((c) => {
          const author = authorLookup.get(c.authorId)
          const name = author?.displayName ?? "Unknown"
          const accent = author?.accentColor
          return (
            <div key={c.id} className="flex gap-2">
              <Avatar
                className="h-7 w-7 mt-0.5"
                style={accent ? { boxShadow: `0 0 0 1.5px ${accent}` } : undefined}
              >
                <AvatarFallback className="bg-gradient-to-br from-zinc-700 to-zinc-900 text-[10px] font-semibold text-zinc-100">
                  {author?.emoji ?? name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[12px] font-semibold leading-none">{name}</span>
                  <span className="text-[10px] text-muted-foreground/80">{formatRelative(c.createdAt)}</span>
                </div>
                <div className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-snug text-foreground/95">
                  {c.body}
                </div>
              </div>
            </div>
          )
        })
      )}
      {me && (
        <div className="flex items-start gap-2 pt-1">
          <Avatar className="h-7 w-7 mt-0.5">
            <AvatarFallback className="bg-gradient-to-br from-amber-200 to-rose-300 text-[10px] font-semibold text-zinc-900">
              {me.displayName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="留言…"
              rows={1}
              className={cn(
                "min-h-[34px] resize-none border-0 bg-background/60 px-2 py-1.5 text-[13px] leading-snug shadow-none focus-visible:ring-1",
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  submit()
                } else if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
            />
            <div className="mt-1 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-full px-3 text-[11px]"
                onClick={submit}
                disabled={!body.trim() || pending}
              >
                {pending && <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />}
                送出
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
