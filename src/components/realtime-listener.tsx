"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function RealtimeListener() {
  const router = useRouter()
  useEffect(() => {
    let es: EventSource | null = null
    let backoff = 1000
    let cancelled = false

    function connect() {
      if (cancelled) return
      es = new EventSource("/api/stream")
      const refresh = () => router.refresh()
      es.addEventListener("post.new", refresh)
      es.addEventListener("post.delete", refresh)
      es.addEventListener("reaction.new", refresh)
      es.addEventListener("reaction.delete", refresh)
      es.addEventListener("agent.status", refresh)
      es.addEventListener("open", () => {
        backoff = 1000
      })
      es.addEventListener("error", () => {
        es?.close()
        if (cancelled) return
        setTimeout(connect, backoff)
        backoff = Math.min(backoff * 2, 30_000)
      })
    }

    connect()
    return () => {
      cancelled = true
      es?.close()
    }
  }, [router])

  return null
}
