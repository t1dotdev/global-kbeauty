import {
  approvalSteps,
  type ApprovalStepStatus,
  type ApprovalTargetType,
  type RoleKind,
} from "~/server/db/schema";
import type { Tx } from "~/server/db/types";

const firstStepStatus: ApprovalStepStatus = "active";
const laterStepStatus: ApprovalStepStatus = "waiting";

type StepInput = {
  requiredKind: RoleKind;
  requiredRoleLevel: number | null;
  requiredCenterId: string | null;
  assignedUserId?: string | null;
};

async function insertSteps(
  tx: Tx,
  targetType: ApprovalTargetType,
  targetId: string,
  steps: StepInput[],
) {
  if (steps.length === 0) return [];
  const rows = steps.map((s, i) => ({
    targetType,
    targetId,
    orderIndex: i,
    requiredKind: s.requiredKind,
    requiredRoleLevel: s.requiredRoleLevel,
    requiredCenterId: s.requiredCenterId,
    assignedUserId: s.assignedUserId ?? null,
    status: i === 0 ? firstStepStatus : laterStepStatus,
  }));
  await tx.insert(approvalSteps).values(rows);
  return rows;
}

/**
 * Center → [Admin]
 */
export async function buildCenterPipeline(tx: Tx, centerId: string) {
  return insertSteps(tx, "center", centerId, [
    { requiredKind: "admin", requiredRoleLevel: null, requiredCenterId: null },
  ]);
}

/**
 * Master Lv N → [Lv N+1 … max in C, Center C, Admin]
 */
export async function buildMasterPipeline(
  tx: Tx,
  masterProfileId: string,
  centerId: string,
  desiredLevel: number,
) {
  const allMasterRoles = await tx.query.roles.findMany({
    where: (r, { eq, and, gt }) =>
      and(eq(r.kind, "master"), gt(r.level, desiredLevel)),
    orderBy: (r, { asc }) => [asc(r.level)],
  });

  const steps: StepInput[] = allMasterRoles.map((r) => ({
    requiredKind: "master",
    requiredRoleLevel: r.level,
    requiredCenterId: centerId,
  }));
  steps.push({
    requiredKind: "center",
    requiredRoleLevel: null,
    requiredCenterId: centerId,
  });
  steps.push({
    requiredKind: "admin",
    requiredRoleLevel: null,
    requiredCenterId: null,
  });
  return insertSteps(tx, "master", masterProfileId, steps);
}

/**
 * Student → [Lv 1 master tied to student's chosen master]
 */
export async function buildStudentPipeline(
  tx: Tx,
  studentProfileId: string,
  assignedLv1MasterUserId: string,
) {
  return insertSteps(tx, "student", studentProfileId, [
    {
      requiredKind: "master",
      requiredRoleLevel: 1,
      requiredCenterId: null,
      assignedUserId: assignedLv1MasterUserId,
    },
  ]);
}

/**
 * Cert request → [student.master, Lv 2 … max in C, Center C, Admin]
 */
export async function buildCertRequestPipeline(
  tx: Tx,
  certRequestId: string,
  centerId: string,
  studentMasterUserId: string,
  studentMasterLevel: number,
) {
  const upperMasterRoles = await tx.query.roles.findMany({
    where: (r, { eq, and, gt }) =>
      and(eq(r.kind, "master"), gt(r.level, studentMasterLevel)),
    orderBy: (r, { asc }) => [asc(r.level)],
  });

  const steps: StepInput[] = [
    {
      requiredKind: "master",
      requiredRoleLevel: studentMasterLevel,
      requiredCenterId: centerId,
      assignedUserId: studentMasterUserId,
    },
    ...upperMasterRoles.map((r) => ({
      requiredKind: "master" as const,
      requiredRoleLevel: r.level,
      requiredCenterId: centerId,
    })),
    {
      requiredKind: "center",
      requiredRoleLevel: null,
      requiredCenterId: centerId,
    },
    {
      requiredKind: "admin",
      requiredRoleLevel: null,
      requiredCenterId: null,
    },
  ];
  return insertSteps(tx, "cert_request", certRequestId, steps);
}
