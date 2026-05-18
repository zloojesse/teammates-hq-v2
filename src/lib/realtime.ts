import { EventEmitter } from "node:events"

export type HqEvent =
  | { kind: "post.new"; postId: string; authorId: string; authorKind: "user" | "agent" }
  | { kind: "post.delete"; postId: string }
  | { kind: "reaction.new"; postId: string; userId?: string; agentId?: string }
  | { kind: "reaction.delete"; postId: string; userId?: string; agentId?: string }
  | { kind: "agent.status"; agentId: string; state: string; task?: string | null }

const globalAny = globalThis as unknown as { __hqBus?: EventEmitter }
function getBus() {
  if (!globalAny.__hqBus) {
    const bus = new EventEmitter()
    bus.setMaxListeners(0)
    globalAny.__hqBus = bus
  }
  return globalAny.__hqBus!
}

export function publish(ev: HqEvent) {
  getBus().emit("hq", ev)
}

export function subscribe(handler: (ev: HqEvent) => void) {
  const bus = getBus()
  bus.on("hq", handler)
  return () => bus.off("hq", handler)
}
