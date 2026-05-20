"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogOutIcon } from "lucide-react"
import type { users } from "@/db/schema"

interface Props {
  me?: typeof users.$inferSelect
  agentCount: number
}

export function TopBar({ me, agentCount }: Props) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/85 px-5 py-3 backdrop-blur-md backdrop-saturate-150">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 to-rose-500/20 text-base">🏢</div>
        <div className="flex flex-col">
          <h1 className="text-[15px] font-semibold leading-none tracking-tight">神隊友總部</h1>
          <p className="mt-0.5 text-[11px] text-muted-foreground">與 {agentCount} 位 AI 神隊友聊天 / 協作</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {me ? (
          <div className="group flex items-center gap-1 rounded-full bg-muted/40 px-2.5 py-1">
            <Avatar className="h-6 w-6">
              {me.avatarUrl ? (
                <img src={me.avatarUrl} alt={me.displayName} className="h-6 w-6 rounded-full" />
              ) : (
                <AvatarFallback className="bg-primary/15 text-[10px] font-semibold">
                  {me.displayName.slice(0, 1)}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-[12px] font-medium">{me.displayName}</span>
            <a
              href="/api/auth/signout"
              className="ml-1 grid h-5 w-5 place-items-center rounded-full text-muted-foreground/60 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              title="登出"
            >
              <LogOutIcon className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <Button asChild variant="default" size="sm" className="h-8 rounded-full px-3 text-[12px]">
            <a href="/api/auth/signin/google?callbackUrl=/">用 Google 登入</a>
          </Button>
        )}
        <Badge variant="outline" className="text-[10px] font-normal">v2</Badge>
      </div>
    </header>
  )
}
