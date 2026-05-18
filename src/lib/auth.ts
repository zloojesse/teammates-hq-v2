import { cookies } from "next/headers"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

// Dev shim. Production: NextAuth v5 with Google OAuth (.env)
// Returns the user record for the current session, or null.
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const email = cookieStore.get("hq_dev_user")?.value || process.env.ALLOWED_EMAILS?.split(",")[0] || "zloojesse@gmail.com"
  if (!email) return null
  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    [user] = await db.insert(users).values({ email, displayName: "信宏", role: "admin" }).returning()
  }
  return user
}

export function isAllowedEmail(email: string) {
  const allowed = (process.env.ALLOWED_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean)
  return allowed.includes(email)
}
