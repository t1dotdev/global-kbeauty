import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { z } from "zod";

import {
  centerCode,
  nextMasterCode,
} from "~/server/api/approval/identifiers";
import {
  markCertRequestApproved,
  markCertRequestDeclined,
} from "~/server/api/routers/certificateRequest";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  approvalSteps,
  centers,
  certificateRequests,
  masterProfiles,
  revenueLedger,
  roles,
  studentProfiles,
  users,
  type ApprovalTargetType,
} from "~/server/db/schema";

type SessionRoleKind = "admin" | "center" | "master" | "student";

async function loadActor(ctx: {
  db: typeof import("~/server/db").db;
  session: { user: { id: string; roleKind: SessionRoleKind | null } };
}) {
  const userId = ctx.session.user.id;
  const user = await ctx.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
    with: { role: true },
  });
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

  const center = await ctx.db.query.centers.findFirst({
    where: (c, { eq, and }) =>
      and(eq(c.ownerUserId, userId), eq(c.status, "approved")),
    columns: { id: true, code: true },
  });
  const master = await ctx.db.query.masterProfiles.findFirst({
    where: (m, { eq, and }) =>
      and(eq(m.userId, userId), eq(m.status, "approved")),
    columns: { id: true, centerId: true, currentLevel: true },
  });

  const kind = user.role?.kind ?? null;
  const level = user.role?.level ?? null;

  return {
    user,
    role: user.role,
    kind,
    level,
    center,
    master,
    amountThb: user.role?.amountThb ?? "0",
  };
}

function buildVisibilityFilter(actor: {
  kind: "admin" | "center" | "master" | null;
  level: number | null;
  center: { id: string } | null;
  master: { centerId: string; currentLevel: number } | null;
  user: { id: string };
}) {
  const orParts = [];
  // 1) Steps assigned directly to this user (e.g. student approvals).
  orParts.push(eq(approvalSteps.assignedUserId, actor.user.id));

  // 2) Admin role.
  if (actor.kind === "admin") {
    orParts.push(eq(approvalSteps.requiredKind, "admin"));
  }

  // 3) Center role: kind=center AND requiredCenterId = my center.
  if (actor.kind === "center" && actor.center) {
    orParts.push(
      and(
        eq(approvalSteps.requiredKind, "center"),
        eq(approvalSteps.requiredCenterId, actor.center.id),
      )!,
    );
  }

  // 4) Master role: kind=master AND requiredCenterId = my center AND
  //    required level <= my level (upper masters approve lower).
  if (actor.kind === "master" && actor.master && actor.level != null) {
    orParts.push(
      and(
        eq(approvalSteps.requiredKind, "master"),
        eq(approvalSteps.requiredCenterId, actor.master.centerId),
        lte(approvalSteps.requiredRoleLevel, actor.master.currentLevel),
      )!,
    );
  }

  return or(...orParts)!;
}

async function enrichStep(
  db: typeof import("~/server/db").db,
  step: typeof approvalSteps.$inferSelect,
) {
  const t = step.targetType as ApprovalTargetType;
  if (t === "center") {
    const c = await db.query.centers.findFirst({
      where: (x, { eq }) => eq(x.id, step.targetId),
      columns: { id: true, name: true, code: true, status: true },
    });
    return { kind: t, target: c };
  }
  if (t === "master") {
    const m = await db.query.masterProfiles.findFirst({
      where: (x, { eq }) => eq(x.id, step.targetId),
      columns: {
        id: true,
        firstNameEn: true,
        lastNameEn: true,
        masterCode: true,
        currentLevel: true,
        centerId: true,
        status: true,
      },
    });
    return { kind: t, target: m };
  }
  if (t === "student") {
    const s = await db.query.studentProfiles.findFirst({
      where: (x, { eq }) => eq(x.id, step.targetId),
      columns: {
        id: true,
        fullNameEn: true,
        studentCode: true,
        masterId: true,
        centerId: true,
        status: true,
      },
    });
    return { kind: t, target: s };
  }
  if (t === "cert_request") {
    const cr = await db.query.certificateRequests.findFirst({
      where: (x, { eq }) => eq(x.id, step.targetId),
      columns: { id: true, studentId: true, courseId: true, status: true },
    });
    return { kind: t, target: cr };
  }
  return { kind: t, target: null };
}

export const approvalRouter = createTRPCRouter({
  myQueue: protectedProcedure.query(async ({ ctx }) => {
    const actor = await loadActor(ctx);
    if (!actor.kind && !actor.master) return [];

    const visibility = buildVisibilityFilter({
      kind: actor.kind === "admin" || actor.kind === "center" || actor.kind === "master"
        ? actor.kind
        : null,
      level: actor.level,
      center: actor.center ?? null,
      master: actor.master ?? null,
      user: { id: actor.user.id },
    });

    const steps = await ctx.db
      .select()
      .from(approvalSteps)
      .where(and(eq(approvalSteps.status, "active"), visibility))
      .orderBy(asc(approvalSteps.createdAt));

    const enriched = await Promise.all(
      steps.map(async (s) => ({
        step: s,
        ...(await enrichStep(ctx.db, s)),
      })),
    );
    return enriched;
  }),

  targetSteps: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["master", "center", "student", "cert_request"]),
        targetId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.approvalSteps.findMany({
        where: (t, { eq, and }) =>
          and(eq(t.targetType, input.targetType), eq(t.targetId, input.targetId)),
        orderBy: (t, { asc }) => [asc(t.orderIndex)],
      });
      return rows;
    }),

  decide: protectedProcedure
    .input(
      z.object({
        stepId: z.string(),
        decision: z.enum(["approve", "decline"]),
        comment: z.string().max(2000).optional(),
        // Only used when admin approves a center on its final step.
        centerCodeSuffix: z.string().min(3).max(4).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = await loadActor(ctx);
      const userId = ctx.session.user.id;

      const step = await ctx.db.query.approvalSteps.findFirst({
        where: (t, { eq }) => eq(t.id, input.stepId),
      });
      if (!step) throw new TRPCError({ code: "NOT_FOUND" });
      if (step.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This step is not currently active.",
        });
      }

      const allowed = (() => {
        if (step.assignedUserId && step.assignedUserId === userId) return true;
        if (step.requiredKind === "admin") return actor.kind === "admin";
        if (step.requiredKind === "center") {
          return (
            actor.kind === "center" &&
            actor.center?.id === step.requiredCenterId
          );
        }
        if (step.requiredKind === "master") {
          if (actor.kind !== "master" || !actor.master) return false;
          if (actor.master.centerId !== step.requiredCenterId) return false;
          if (
            step.requiredRoleLevel != null &&
            actor.master.currentLevel < step.requiredRoleLevel
          ) {
            return false;
          }
          return true;
        }
        return false;
      })();
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });

      return await ctx.db.transaction(async (tx) => {
        await tx
          .update(approvalSteps)
          .set({
            status: input.decision === "approve" ? "approved" : "declined",
            decidedByUserId: userId,
            decidedAt: new Date(),
            comment: input.comment,
          })
          .where(eq(approvalSteps.id, step.id));

        // Revenue ledger for non-admin approvals.
        if (input.decision === "approve" && step.requiredKind !== "admin") {
          await tx.insert(revenueLedger).values({
            userId,
            amountThb: actor.amountThb,
            sourceType: step.targetType,
            sourceId: step.targetId,
          });
        }

        if (input.decision === "decline") {
          await skipRemainingSteps(tx, step);
          await markTargetDeclined(tx, step);
          return { status: "declined" as const };
        }

        // Approved: find the next waiting step in this pipeline.
        const next = await tx.query.approvalSteps.findFirst({
          where: (t, { and, eq, gt }) =>
            and(
              eq(t.targetType, step.targetType),
              eq(t.targetId, step.targetId),
              gt(t.orderIndex, step.orderIndex),
              eq(t.status, "waiting"),
            ),
          orderBy: (t, { asc }) => [asc(t.orderIndex)],
        });

        if (next) {
          await tx
            .update(approvalSteps)
            .set({ status: "active" })
            .where(eq(approvalSteps.id, next.id));
          return { status: "advanced" as const };
        }

        // No next step → final approval. Allocate identifiers and finish.
        await finalizeApproval(tx, step, input.centerCodeSuffix);
        return { status: "completed" as const };
      });
    }),
});

async function skipRemainingSteps(
  tx: Parameters<Parameters<typeof import("~/server/db").db.transaction>[0]>[0],
  step: typeof approvalSteps.$inferSelect,
) {
  const remaining = await tx
    .select({ id: approvalSteps.id })
    .from(approvalSteps)
    .where(
      and(
        eq(approvalSteps.targetType, step.targetType),
        eq(approvalSteps.targetId, step.targetId),
        eq(approvalSteps.status, "waiting"),
      ),
    );
  if (remaining.length === 0) return;
  await tx
    .update(approvalSteps)
    .set({ status: "skipped" })
    .where(
      inArray(
        approvalSteps.id,
        remaining.map((r) => r.id),
      ),
    );
}

async function markTargetDeclined(
  tx: Parameters<Parameters<typeof import("~/server/db").db.transaction>[0]>[0],
  step: typeof approvalSteps.$inferSelect,
) {
  if (step.targetType === "center") {
    const c = await tx.query.centers.findFirst({
      where: (x, { eq }) => eq(x.id, step.targetId),
    });
    if (c) {
      await tx
        .update(centers)
        .set({ status: "declined" })
        .where(eq(centers.id, c.id));
      await tx
        .update(users)
        .set({ status: "declined" })
        .where(eq(users.id, c.ownerUserId));
    }
  } else if (step.targetType === "master") {
    const m = await tx.query.masterProfiles.findFirst({
      where: (x, { eq }) => eq(x.id, step.targetId),
    });
    if (m) {
      await tx
        .update(masterProfiles)
        .set({ status: "declined" })
        .where(eq(masterProfiles.id, m.id));
      await tx
        .update(users)
        .set({ status: "declined" })
        .where(eq(users.id, m.userId));
    }
  } else if (step.targetType === "student") {
    const s = await tx.query.studentProfiles.findFirst({
      where: (x, { eq }) => eq(x.id, step.targetId),
    });
    if (s) {
      await tx
        .update(studentProfiles)
        .set({ status: "declined" })
        .where(eq(studentProfiles.id, s.id));
      await tx
        .update(users)
        .set({ status: "declined" })
        .where(eq(users.id, s.userId));
    }
  } else if (step.targetType === "cert_request") {
    await markCertRequestDeclined(tx, step.targetId);
  }
}

async function finalizeApproval(
  tx: Parameters<Parameters<typeof import("~/server/db").db.transaction>[0]>[0],
  step: typeof approvalSteps.$inferSelect,
  centerCodeSuffix?: string,
) {
  if (step.targetType === "center") {
    if (!centerCodeSuffix) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Admin must supply a center code suffix to finalize approval.",
      });
    }
    const code = centerCode(centerCodeSuffix);
    const existing = await tx.query.centers.findFirst({
      where: (x, { eq }) => eq(x.code, code),
    });
    if (existing && existing.id !== step.targetId) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Center code ${code} is already in use.`,
      });
    }
    const c = await tx.query.centers.findFirst({
      where: (x, { eq }) => eq(x.id, step.targetId),
    });
    if (!c) return;
    await tx
      .update(centers)
      .set({ status: "approved", code })
      .where(eq(centers.id, c.id));
    // Assign the center role to the owner user.
    const centerRole = await tx.query.roles.findFirst({
      where: (r, { eq, and, isNull }) =>
        and(eq(r.kind, "center"), isNull(r.level)),
    });
    await tx
      .update(users)
      .set({ status: "approved", roleId: centerRole?.id })
      .where(eq(users.id, c.ownerUserId));
  } else if (step.targetType === "master") {
    const m = await tx.query.masterProfiles.findFirst({
      where: (x, { eq }) => eq(x.id, step.targetId),
    });
    if (!m) return;
    const center = await tx.query.centers.findFirst({
      where: (x, { eq }) => eq(x.id, m.centerId),
    });
    if (!center) return;
    const code = await nextMasterCode(tx, center.code, m.currentLevel);
    await tx
      .update(masterProfiles)
      .set({ status: "approved", masterCode: code })
      .where(eq(masterProfiles.id, m.id));
    const masterRole = await tx.query.roles.findFirst({
      where: (r, { eq, and }) =>
        and(eq(r.kind, "master"), eq(r.level, m.currentLevel)),
    });
    await tx
      .update(users)
      .set({ status: "approved", roleId: masterRole?.id })
      .where(eq(users.id, m.userId));
  } else if (step.targetType === "student") {
    const s = await tx.query.studentProfiles.findFirst({
      where: (x, { eq }) => eq(x.id, step.targetId),
    });
    if (!s) return;
    // Allocate student code from master code.
    const m = await tx.query.masterProfiles.findFirst({
      where: (x, { eq }) => eq(x.id, s.masterId),
    });
    if (!m?.masterCode) return;
    const { nextStudentCode } = await import(
      "~/server/api/approval/identifiers"
    );
    const code = await nextStudentCode(tx, m.masterCode);
    await tx
      .update(studentProfiles)
      .set({ status: "approved", studentCode: code })
      .where(eq(studentProfiles.id, s.id));
    await tx
      .update(users)
      .set({ status: "approved" })
      .where(eq(users.id, s.userId));
  }
  if (step.targetType === "cert_request") {
    await markCertRequestApproved(tx, step.targetId);
  }
  void roles;
  void isNull;
  void certificateRequests;
}
