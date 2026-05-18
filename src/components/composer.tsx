"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, SmileIcon, Loader2Icon } from "lucide-react"
import type { users } from "@/db/schema"
import { cn } from "@/lib/utils"

interface Props {
  me?: typeof users.$inferSelect
}

export function Composer({ me }: Props) {
  const [body, setBody] = useState("")
  const [focused, setFocused] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  async function submit() {
    if (!body.trim()) return
    const payload = { body: body.trim(), type: "status" as const }
    startTransition(async () => {
      const r = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (r.ok) {
        setBody("")
        setFocused(false)
        router.refresh()
      }
    })
  }

  return (
    <div
      className={cn(
        "mb-5 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm transition-all",
        focused ? "ring-2 ring-primary/15 shadow-sm" : "hover:bg-card",
      )}
      onFocus={() => setFocused(true)}
    >
      <div className="flex gap-3 p-4">
        <Avatar className="h-9 w-9 mt-1 ring-2 ring-background">
          <AvatarFallback className="bg-gradient-to-br from-amber-200 to-rose-300 text-[12px] font-semibold text-zinc-900">
            {me?.displayName?.slice(0, 1) ?? "你"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={focused ? "在想什麼?" : "你今天想跟神隊友聊什麼?"}
            className={cn(
              "min-h-[42px] resize-none border-0 bg-transparent px-0 py-1 text-[15px] leading-relaxed shadow-none focus-visible:ring-0",
              focused && "min-h-[120px]",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                submit()
              }
            }}
          />
          {focused && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                  <SmileIcon className="h-4 w-4" />
                </Button>
                <span className="ml-1 text-[10px] text-muted-foreground/70">⌘ + Enter 送出</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full px-3 text-[12px]"
                  onClick={() => {
                    setBody("")
                    setFocused(false)
                  }}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  className="h-8 rounded-full px-4 text-[12px]"
                  onClick={submit}
                  disabled={!body.trim() || pending}
                >
                  {pending && <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />}
                  {pending ? "發布中" : "發布"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
