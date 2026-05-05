import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
  setLocale: protectedProcedure
    .input(z.object({ locale: z.enum(["en", "kr"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ preferredLocale: input.locale })
        .where(eq(users.id, ctx.session.user.id));
      return { ok: true };
    }),
});
