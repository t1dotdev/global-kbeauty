import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { env } from "~/env";
import type { Locale, UserStatus } from "~/server/db/schema";

export type SessionRoleKind = "admin" | "center" | "master" | "student";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      status: UserStatus;
      roleKind: SessionRoleKind | null;
      roleLevel: number | null;
      preferredLocale: Locale;
    } & DefaultSession["user"];
  }
}

/**
 * Edge-safe NextAuth config.
 *
 * Used by middleware (which runs on the edge runtime). No DB adapter,
 * no Node-only modules. The session is read straight off the JWT.
 *
 * The full config in `./config.ts` extends this with the Drizzle adapter
 * and a Node-side `jwt` callback that hydrates token fields from the DB.
 */
export const authEdgeConfig = {
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID ?? "",
      clientSecret: env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub! ?? "",
        status: (token.status as UserStatus) ?? "pending_profile",
        roleKind: (token.roleKind as SessionRoleKind | null) ?? null,
        roleLevel: (token.roleLevel as number | null) ?? null,
        preferredLocale: (token.preferredLocale as Locale) ?? "en",
      },
    }),
  },
} satisfies NextAuthConfig;
