/**
 * NextAuth v5 config — Google OAuth for the single admin (zloojesse@gmail.com).
 *
 * Conditional: Google provider only registers when GOOGLE_CLIENT_ID is set.
 * Otherwise NextAuth has no providers and `auth()` returns null → callers fall back to dev shim.
 *
 * We DO NOT use the Drizzle adapter — schema doesn't match NextAuth's user table.
 * Instead, we upsert into our `users` table inside the signIn callback and stash
 * our internal id on the session via the `jwt` strategy.
 */
import NextAuth, { type NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { isAllowedEmail } from "@/lib/auth"

const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: googleEnabled
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ]
    : [],
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
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
export const isGoogleEnabled = googleEnabled
