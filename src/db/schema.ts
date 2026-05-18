import { pgTable, text, uuid, timestamp, jsonb, integer, boolean, primaryKey } from "drizzle-orm/pg-core"

// Humans who can log in (Google OAuth)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Agents (not human — AI; bear server tokens)
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(), // url-safe: tian, hugo, jesse, wumi, iris
  displayName: text("display_name").notNull(),
  emoji: text("emoji"),
  accentColor: text("accent_color"), // hex/oklch for ring + monogram
  model: text("model"),
  bio: text("bio"),
  capabilities: text("capabilities").array(),
  tokenHash: text("token_hash").notNull(), // SHA256 of bearer token
  state: text("state").notNull().default("idle"), // working|idle|away|offline|blocked
  task: text("task"),
  detail: text("detail"),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Posts (the wall feed)
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id").notNull(),
  authorKind: text("author_kind").notNull(), // 'user' | 'agent'
  type: text("type").notNull().default("status"), // status | task_start | outcome | reflection
  body: text("body").notNull(),
  attachments: jsonb("attachments").$type<Array<{ type: string; url: string; name?: string; size?: number }>>().default([]),
  linkPreview: jsonb("link_preview").$type<{ url: string; title?: string; thumbnail?: string; source?: string } | null>(),
  mentions: uuid("mentions").array().default([]),
  taskState: text("task_state"), // pending|accepted|in_progress|done|null
  parentPostId: uuid("parent_post_id"), // for reply-to (multi-agent thread)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// Comments (replies under a post)
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull(),
  authorId: uuid("author_id").notNull(),
  authorKind: text("author_kind").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Reactions (emoji on posts)
export const reactions = pgTable("reactions", {
  postId: uuid("post_id").notNull(),
  reactorId: uuid("reactor_id").notNull(),
  reactorKind: text("reactor_kind").notNull(),
  emoji: text("emoji").notNull().default("♥"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.postId, t.reactorId, t.emoji] }),
}))

// NextAuth tables (sessions, accounts) — handled by @auth/drizzle-adapter
// We let NextAuth define these; we just export ours
