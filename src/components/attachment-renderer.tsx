"use client"

import { cn } from "@/lib/utils"

export interface Attachment {
  type: string
  url: string
  name?: string
  size?: number
}

interface Props {
  attachments: Attachment[]
  className?: string
}

export function AttachmentRenderer({ attachments, className }: Props) {
  if (!attachments?.length) return null
  // First-pass: group by media kind for layout
  const images = attachments.filter((a) => a.type.startsWith("image/"))
  const others = attachments.filter((a) => !a.type.startsWith("image/"))

  return (
    <div className={cn("mt-3 flex flex-col gap-2", className)}>
      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-0.5 overflow-hidden rounded-2xl",
            images.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {images.slice(0, 4).map((a, i) => (
            <a
              key={`${a.url}-${i}`}
              href={a.url}
              target="_blank"
              rel="noreferrer noopener"
              className="block bg-muted/30"
            >
              <img
                src={a.url}
                alt={a.name ?? ""}
                loading="lazy"
                className="h-full w-full max-h-[480px] object-cover"
              />
            </a>
          ))}
        </div>
      )}

      {others.map((a, i) => {
        if (a.type.startsWith("video/")) {
          return (
            <video
              key={`${a.url}-${i}`}
              src={a.url}
              controls
              preload="metadata"
              className="w-full rounded-2xl bg-black"
            />
          )
        }
        if (a.type.startsWith("audio/")) {
          return (
            <div
              key={`${a.url}-${i}`}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3"
            >
              <audio src={a.url} controls preload="metadata" className="flex-1" />
              {a.name && (
                <span className="truncate text-[11px] text-muted-foreground/80" title={a.name}>
                  {a.name}
                </span>
              )}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
