"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatRelative } from "@/lib/relative-time"
import type { PublicAgent } from "@/lib/agent-auth"

interface Props {
  agents: PublicAgent[]
}

const STATE_DOT: Record<string, string> = {
  working: "bg-emerald-500",
  idle: "bg-zinc-500",
  away: "bg-amber-500",
  blocked: "bg-rose-500",
  offline: "bg-zinc-700",
}

const STATE_LABEL: Record<string, string> = {
  working: "工作中",
  idle: "閒置",
  away: "離開",
  blocked: "卡住",
  offline: "離線",
}

export function AgentRoster({ agents }: Props) {
  if (agents.length === 0) return null
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground/70">神隊友陣容</h2>
        <span className="text-[10px] text-muted-foreground/60">{agents.length} 位 · {agents.filter((a) => a.state === "working").length} 工作中</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {agents.map((a) => {
          const dot = STATE_DOT[a.state] ?? STATE_DOT.idle
          const label = STATE_LABEL[a.state] ?? a.state
          return (
            <div
              key={a.id}
              className={cn(
                "group min-w-[148px] shrink-0 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm",
                "p-3 transition-all hover:bg-card hover:border-border",
              )}
              style={a.accentColor ? { ["--accent" as string]: a.accentColor } : undefined}
            >
              <div className="flex items-start gap-2.5">
                <div className="relative">
                  <Avatar
                    className="h-9 w-9"
                    style={a.accentColor ? { boxShadow: `0 0 0 2px var(--background), 0 0 0 3.5px ${a.accentColor}` } : undefined}
                  >
                    <AvatarFallback className="bg-gradient-to-br from-zinc-700 to-zinc-900 text-[12px] font-semibold text-zinc-100">
                      {a.emoji ?? a.displayName.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                      dot,
                      a.state === "working" && "animate-pulse",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold leading-tight">{a.displayName}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground/80">{label}</div>
                </div>
              </div>
              {a.task && (
                <div className="mt-2 truncate text-[11px] text-foreground/80" title={a.task}>
                  {a.task}
                </div>
              )}
              {a.lastActivityAt && (
                <div className="mt-1 text-[10px] text-muted-foreground/60">{formatRelative(a.lastActivityAt)}</div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
