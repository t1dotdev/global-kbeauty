import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type NextAuthConfig } from "next-auth";

import { db } from "~/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";
import { authEdgeConfig, type SessionRoleKind } from "./config.edge";

/**
 * Full Node-side NextAuth config. Adds the Drizzle adapter and a
 * DB-backed `jwt` callback that hydrates token fields from the user
 * row + role + student profile (so the edge `session` callback can
 * read them without DB).
 */
export const authConfig = {
  ...authEdgeConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    ...authEdgeConfig.callbacks,
    jwt: async ({ token, user, trigger }) => {
      const userId = user?.id ?? token.sub;
      if (!userId) return token;

      // Hydrate on every JWT pass — keeps role/status in sync after admin
      // approvals without forcing re-login. Single keyed user lookup.
      void trigger;
      void user;
      {
        const dbUser = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, userId),
          with: { role: true },
        });

        let roleKind: SessionRoleKind | null = null;
        const kind = dbUser?.role?.kind;
        if (kind === "admin" || kind === "center" || kind === "master") {
          roleKind = kind;
        } else {
          const student = await db.query.studentProfiles.findFirst({
            where: (s, { eq }) => eq(s.userId, userId),
          });
          if (student) roleKind = "student";
        }

        token.sub = userId;
        token.status = dbUser?.status ?? "pending_profile";
        token.roleKind = roleKind;
        token.roleLevel = dbUser?.role?.level ?? null;
        token.preferredLocale = dbUser?.preferredLocale ?? "en";
      }

      return token;
    },
  },
} satisfies NextAuthConfig;
