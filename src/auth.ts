/**
 * NextAuth v5 config — Google OAuth for the single admin (zloojesse@gmail.com).
 *
 * We use the function-form `NextAuth((req) => config)` so every read of
 * process.env happens at REQUEST time, not at build time. Zeabur injects
 * env vars at container runtime — if we evaluated the config at module load
 * (or worse, at `next build`), GOOGLE_CLIENT_ID would be undefined and
 * NextAuth would emit a `?error=Configuration`.
 */
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { isAllowedEmail } from "@/lib/auth"

export function isGoogleEnabled(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email
      if (!email || !isAllowedEmail(email)) return false
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (existing.length === 0) {
        await db.insert(users).values({
          email,
          displayName: user.name ?? email.split("@")[0],
          avatarUrl: user.image ?? null,
          role: "admin",
        })
      } else if (user.image && !existing[0].avatarUrl) {
        await db.update(users).set({ avatarUrl: user.image }).where(eq(users.email, email))
      }
      return true
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const [row] = await db.select().from(users).where(eq(users.email, user.email)).limit(1)
        if (row) token.uid = row.id
      }
      return token
    },
    async session({ session, token }) {
      if (token.uid && session.user) {
        (session.user as { id?: string }).id = token.uid as string
      }
      return session
    },
  },
}))
