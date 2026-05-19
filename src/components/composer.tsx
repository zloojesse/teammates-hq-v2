"use client"

import { useRef, useState, useTransition } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, SmileIcon, Loader2Icon, XIcon, FileAudio2Icon, FilmIcon } from "lucide-react"
import type { users } from "@/db/schema"
import { cn } from "@/lib/utils"
import type { Attachment } from "@/components/attachment-renderer"

interface Props {
  me?: typeof users.$inferSelect
  onSubmit?: (body: string, attachments: Attachment[]) => void
}

interface Pending {
  localId: string
  preview: string
  name: string
  type: string
  size: number
  status: "uploading" | "done" | "error"
  url?: string
  error?: string
}

export function Composer({ me, onSubmit }: Props) {
  const [body, setBody] = useState("")
  const [focused, setFocused] = useState(false)
  const [pending, startTransition] = useTransition()
  const [items, setItems] = useState<Pending[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const counter = useRef(0)

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 4)
    for (const f of list) {
      const localId = `f-${++counter.current}-${Date.now()}`
      const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : ""
      setItems((cur) => [...cur, { localId, preview, name: f.name, type: f.type, size: f.size, status: "uploading" }])
      const form = new FormData()
      form.append("file", f)
      fetch("/api/upload", { method: "POST", body: form })
        .then(async (r) => {
          if (!r.ok) {
            const err = await r.json().catch(() => ({}))
            throw new Error(err.error || `${r.status}`)
          }
          return r.json()
        })
        .then((j: { url: string; type: string; name: string; size: number }) => {
          setItems((cur) => cur.map((it) => (it.localId === localId ? { ...it, status: "done", url: j.url } : it)))
        })
        .catch((e: Error) => {
          setItems((cur) => cur.map((it) => (it.localId === localId ? { ...it, status: "error", error: e.message } : it)))
        })
    }
  }

  function removeItem(id: string) {
    setItems((cur) => cur.filter((it) => it.localId !== id))
  }

  function reset() {
    setBody("")
    setFocused(false)
    setItems([])
  }

  function submit() {
    const trimmed = body.trim()
    const ready = items.filter((it) => it.status === "done" && it.url)
    if (!trimmed && ready.length === 0) return
    const attachments: Attachment[] = ready.map((it) => ({
      url: it.url!,
      type: it.type,
      name: it.name,
      size: it.size,
    }))
    if (onSubmit) {
      reset()
      startTransition(() => onSubmit(trimmed, attachments))
      return
    }
    startTransition(async () => {
      const r = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed, type: "status", attachments }),
      })
      if (r.ok) reset()
    })
  }

  const uploading = items.some((it) => it.status === "uploading")
  const canSubmit = !pending && !uploading && (body.trim().length > 0 || items.some((it) => it.status === "done"))

  return (
    <div
      className={cn(
        "mb-5 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm transition-all",
        focused ? "ring-2 ring-primary/15 shadow-sm" : "hover:bg-card",
        dragOver && "ring-2 ring-primary/40",
      )}
      onFocus={() => setFocused(true)}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault()
          setDragOver(true)
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
        setFocused(true)
      }}
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
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files)
              if (files.length) {
                e.preventDefault()
                addFiles(files)
                setFocused(true)
              }
            }}
          />

          {items.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <AnimatePresence initial={false}>
                {items.map((it) => (
                  <motion.div
                    key={it.localId}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border border-border/60 bg-muted/30",
                      it.status === "uploading" && "opacity-70",
                      it.status === "error" && "border-rose-500/60",
                    )}
                  >
                    {it.preview ? (
                      <img src={it.preview} alt={it.name} className="h-28 w-full object-cover" />
                    ) : (
                      <div className="flex h-28 items-center justify-center gap-2 px-2 text-[12px] text-muted-foreground">
                        {it.type.startsWith("audio/") ? <FileAudio2Icon className="h-4 w-4" /> : it.type.startsWith("video/") ? <FilmIcon className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                        <span className="truncate" title={it.name}>{it.name}</span>
                      </div>
                    )}
                    {it.status === "uploading" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                        <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {it.status === "error" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-rose-500/15 px-2 text-center text-[11px] text-rose-300">
                        {it.error}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(it.localId)}
                      className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity backdrop-blur-sm group-hover:opacity-100"
                      aria-label="remove"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {focused && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*,audio/*,video/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files)
                    e.target.value = ""
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground"
                  onClick={() => fileInput.current?.click()}
                  type="button"
                >
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
                  onClick={reset}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  className="h-8 rounded-full px-4 text-[12px]"
                  onClick={submit}
                  disabled={!canSubmit}
                >
                  {(pending || uploading) && <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />}
                  {uploading ? "上傳中" : pending ? "發布中" : "發布"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
