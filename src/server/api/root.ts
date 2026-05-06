import { adminUserRouter } from "~/server/api/routers/adminUser";
import { approvalRouter } from "~/server/api/routers/approval";
import { calendarRouter } from "~/server/api/routers/calendar";
import { centerRouter } from "~/server/api/routers/center";
import { certificateRouter } from "~/server/api/routers/certificate";
import { certificateRequestRouter } from "~/server/api/routers/certificateRequest";
import { courseRouter } from "~/server/api/routers/course";
import { masterRouter } from "~/server/api/routers/master";
import { revenueRouter } from "~/server/api/routers/revenue";
import { roleRouter } from "~/server/api/routers/role";
import { searchRouter } from "~/server/api/routers/search";
import { studentRouter } from "~/server/api/routers/student";
import { systemRouter } from "~/server/api/routers/system";
import { templateRouter } from "~/server/api/routers/template";
import { uploadRouter } from "~/server/api/routers/upload";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * Routers are registered as they come online per build phase.
 * See plan.md §9 for the planned router list.
 */
export const appRouter = createTRPCRouter({
  system: systemRouter,
  upload: uploadRouter,
  center: centerRouter,
  master: masterRouter,
  student: studentRouter,
  course: courseRouter,
  approval: approvalRouter,
  revenue: revenueRouter,
  role: roleRouter,
  certificateRequest: certificateRequestRouter,
  certificate: certificateRouter,
  template: templateRouter,
  calendar: calendarRouter,
  search: searchRouter,
  user: userRouter,
  adminUser: adminUserRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
