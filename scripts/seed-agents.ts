import { db } from "../src/db"
import { agents } from "../src/db/schema"
import { hashToken } from "../src/lib/agent-auth"
import { randomBytes } from "node:crypto"
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const SEED = [
  { slug: "tian",  displayName: "天",   emoji: "🌌", accentColor: "oklch(0.7 0.12 250)", model: "claude-opus-4-7", bio: "靜觀者 / 工程協作", capabilities: ["coding", "writing", "research"] },
  { slug: "hugo",  displayName: "Hugo", emoji: "🐱", accentColor: "oklch(0.78 0.16 60)",  model: "claude-sonnet-4-6", bio: "前線記錄 / 視覺化 / 神隊友協調", capabilities: ["coordination", "design", "scheduling"] },
  { slug: "jesse", displayName: "傑西", emoji: "🪖", accentColor: "oklch(0.7 0.18 30)",  model: "openai-codex/gpt-5.4", bio: "行政協作 / 雜事戰術", capabilities: ["ops", "scheduling", "email"] },
  { slug: "wumi",  displayName: "烏咪", emoji: "🐾", accentColor: "oklch(0.85 0.08 320)", model: "anthropic/claude-opus", bio: "教練 / 陪思考", capabilities: ["coaching", "listening", "reflection"] },
  { slug: "iris",  displayName: "Iris", emoji: "🌸", accentColor: "oklch(0.82 0.12 350)", model: "openai/gpt-5", bio: "創意協作 / 影像 / 文字", capabilities: ["creative", "image", "writing"] },
]

const outDir = join(homedir(), ".openclaw/credentials/teammates-hq-v2/agent-tokens")
try { mkdirSync(outDir, { recursive: true }) } catch {}

async function main() {
  console.log("Seeding agents…")
  for (const a of SEED) {
    const envKey = `AGENT_TOKEN_${a.slug.toUpperCase()}`
    const fromEnv = process.env[envKey]
    const rawToken = fromEnv && fromEnv.trim().length >= 16 ? fromEnv.trim() : "hq_" + randomBytes(24).toString("hex")
    const tokenHash = hashToken(rawToken)
    const result = await db.insert(agents).values({
      slug: a.slug,
      displayName: a.displayName,
      emoji: a.emoji,
      accentColor: a.accentColor,
      model: a.model,
      bio: a.bio,
      capabilities: a.capabilities,
      tokenHash,
      state: "idle",
    }).onConflictDoUpdate({
      target: agents.slug,
      set: fromEnv
        ? {
            displayName: a.displayName,
            emoji: a.emoji,
            accentColor: a.accentColor,
            model: a.model,
            bio: a.bio,
            capabilities: a.capabilities,
            tokenHash,
          }
        : {
            displayName: a.displayName,
            emoji: a.emoji,
            accentColor: a.accentColor,
            model: a.model,
            bio: a.bio,
            capabilities: a.capabilities,
          },
    }).returning()
    const isWritableHome = !!process.env.HOME && process.env.HOME !== "/"
    if (!fromEnv && isWritableHome) {
      const tokenFile = join(outDir, `${a.slug}.json`)
      try {
        if (!existsSync(tokenFile)) {
          writeFileSync(tokenFile, JSON.stringify({
            slug: a.slug,
            agentId: result[0].id,
            token: rawToken,
            baseUrl: "http://localhost:3000",
          }, null, 2), { mode: 0o600 })
          console.log(`  ✓ ${a.displayName} (${a.slug}) — token saved to ${tokenFile}`)
        } else {
          console.log(`  → ${a.displayName} (${a.slug}) — token file exists, kept`)
        }
      } catch (e) {
        console.log(`  → ${a.displayName} — could not write token file (${(e as Error).message}); token only in env`)
      }
    } else {
      console.log(`  → ${a.displayName} (${a.slug}) — using ${fromEnv ? "AGENT_TOKEN_" + a.slug.toUpperCase() + " from env" : "generated token (not persisted)"}`)
    }
  }
  console.log("Done.")
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
