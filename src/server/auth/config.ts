import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
  type Locale,
  type UserStatus,
} from "~/server/db/schema";

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

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID ?? "",
      clientSecret: env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session: async ({ session, user }) => {
      const dbUser = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.id),
        with: { role: true },
      });

      let roleKind: SessionRoleKind | null = null;
      const kind = dbUser?.role?.kind;
      if (kind === "admin" || kind === "center" || kind === "master") {
        roleKind = kind;
      } else {
        const student = await db.query.studentProfiles.findFirst({
          where: (s, { eq }) => eq(s.userId, user.id),
        });
        if (student) roleKind = "student";
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          status: dbUser?.status ?? "pending_profile",
          roleKind,
          roleLevel: dbUser?.role?.level ?? null,
          preferredLocale: dbUser?.preferredLocale ?? "en",
        },
      };
    },
  },
} satisfies NextAuthConfig;
