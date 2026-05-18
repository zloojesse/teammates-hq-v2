import { subscribe } from "@/lib/realtime"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const encoder = new TextEncoder()
  let unsub: (() => void) | null = null
  let keepalive: NodeJS.Timeout | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          // closed
        }
      }
      send(`retry: 2000\n\n`)
      send(`event: hello\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`)

      unsub = subscribe((ev) => {
        send(`event: ${ev.kind}\ndata: ${JSON.stringify(ev)}\n\n`)
      })

      keepalive = setInterval(() => send(`: ka ${Date.now()}\n\n`), 15000)

      const close = () => {
        if (unsub) unsub()
        if (keepalive) clearInterval(keepalive)
        try {
          controller.close()
        } catch {}
      }
      req.signal.addEventListener("abort", close)
    },
    cancel() {
      if (unsub) unsub()
      if (keepalive) clearInterval(keepalive)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
