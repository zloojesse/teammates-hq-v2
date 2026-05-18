import { cookies } from "next/headers"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export function isAllowedEmail(email: string) {
  const allowed = (process.env.ALLOWED_EMAILS || "zloojesse@gmail.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return allowed.includes(email)
}

/**
 * Returns the current user.
 *
 * Resolution order:
 *  1. NextAuth session (when GOOGLE_CLIENT_ID is set) — real OAuth login.
 *  2. Dev cookie shim (default fallback) — auto-creates the allow-listed admin so dev "just works".
 *
 * The two paths converge on the same users-table row, keyed by email.
 */
export async function getCurrentUser() {
  // Try NextAuth first (lazy import to avoid circular dep at module load)
  try {
    const { auth, isGoogleEnabled } = await import("@/auth")
    if (isGoogleEnabled) {
      const session = await auth()
      const email = session?.user?.email
      if (email && isAllowedEmail(email)) {
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (user) return user
      }
      return null
    }
  } catch {
    // fall through to dev shim
  }

  // Dev shim
  const cookieStore = await cookies()
  const email = cookieStore.get("hq_dev_user")?.value ||
    process.env.ALLOWED_EMAILS?.split(",")[0] ||
    "zloojesse@gmail.com"
  if (!email) return null
  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    [user] = await db.insert(users).values({ email, displayName: "信宏", role: "admin" }).returning()
  }
  return user
}
