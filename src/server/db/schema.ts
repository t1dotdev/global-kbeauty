import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

export const createTable = pgTableCreator((name) => `global-kbeauty_${name}`);

// ─────────────────────────────────────────────────────────────────────────────
// Enums (as text with check via app layer; kept as varchar to stay portable)
// ─────────────────────────────────────────────────────────────────────────────

export type RoleKind = "master" | "center" | "admin";
export type UserStatus =
  | "pending_profile"
  | "pending_approval"
  | "approved"
  | "declined";
export type Locale = "en" | "kr";
export type ApprovalTargetType =
  | "master"
  | "center"
  | "student"
  | "cert_request";
export type ApprovalStepStatus =
  | "waiting"
  | "active"
  | "approved"
  | "declined"
  | "skipped";
export type EntityStatus =
  | "pending_profile"
  | "pending_approval"
  | "approved"
  | "declined";

// ─────────────────────────────────────────────────────────────────────────────
// Roles
// ─────────────────────────────────────────────────────────────────────────────

export const roles = createTable(
  "role",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 128 }).notNull(),
    description: d.text(),
    amountThb: d.numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    level: d.integer(),
    kind: d.varchar({ length: 16 }).$type<RoleKind>().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("role_kind_level_uniq").on(t.kind, t.level),
    index("role_kind_idx").on(t.kind),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Auth tables (NextAuth) extended
// ─────────────────────────────────────────────────────────────────────────────

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({ mode: "date", withTimezone: true })
    .$defaultFn(() => new Date()),
  image: d.varchar({ length: 255 }),
  roleId: d.varchar({ length: 255 }).references(() => roles.id),
  status: d
    .varchar({ length: 32 })
    .$type<UserStatus>()
    .notNull()
    .default("pending_profile"),
  preferredLocale: d
    .varchar({ length: 8 })
    .$type<Locale>()
    .notNull()
    .default("en"),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  centerOwned: one(centers, {
    fields: [users.id],
    references: [centers.ownerUserId],
  }),
  masterProfile: one(masterProfiles, {
    fields: [users.id],
    references: [masterProfiles.userId],
  }),
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ─────────────────────────────────────────────────────────────────────────────
// Center
// ─────────────────────────────────────────────────────────────────────────────

export const centers = createTable(
  "center",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: d.varchar({ length: 32 }).notNull(),
    ownerUserId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    directorTitle: d.varchar({ length: 64 }),
    directorName: d.varchar({ length: 255 }),
    directorIdCard: d.varchar({ length: 64 }),
    vocationalFields: d
      .text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    contents: d
      .text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    appointmentDate: d.timestamp({ withTimezone: true }),
    appointmentNumber: d.varchar({ length: 128 }),
    name: d.varchar({ length: 255 }).notNull(),
    address: d.text(),
    idCardUrl: d.varchar({ length: 1024 }),
    paymentSlipUrl: d.varchar({ length: 1024 }),
    photoUrl: d.varchar({ length: 1024 }),
    status: d
      .varchar({ length: 32 })
      .$type<EntityStatus>()
      .notNull()
      .default("pending_approval"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("center_code_uniq").on(t.code),
    uniqueIndex("center_owner_uniq").on(t.ownerUserId),
    index("center_status_idx").on(t.status),
  ],
);

export const centersRelations = relations(centers, ({ one, many }) => ({
  owner: one(users, {
    fields: [centers.ownerUserId],
    references: [users.id],
  }),
  masters: many(masterProfiles),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Master profile
// ─────────────────────────────────────────────────────────────────────────────

export const masterProfiles = createTable(
  "master_profile",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    centerId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => centers.id),
    masterCode: d.varchar({ length: 64 }),
    titleTh: d.varchar({ length: 64 }),
    firstNameTh: d.varchar({ length: 128 }),
    lastNameTh: d.varchar({ length: 128 }),
    titleEn: d.varchar({ length: 64 }),
    firstNameEn: d.varchar({ length: 128 }),
    lastNameEn: d.varchar({ length: 128 }),
    idCardNumber: d.varchar({ length: 64 }),
    completedCourse: d.varchar({ length: 128 }),
    completedCourseOther: d.text(),
    certificateRequestDate: d.timestamp({ withTimezone: true }),
    completionDate: d.timestamp({ withTimezone: true }),
    idCardUrl: d.varchar({ length: 1024 }),
    photoUrl: d.varchar({ length: 1024 }),
    currentLevel: d.integer().notNull().default(1),
    desiredLevel: d.integer().notNull().default(1),
    status: d
      .varchar({ length: 32 })
      .$type<EntityStatus>()
      .notNull()
      .default("pending_approval"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("master_user_uniq").on(t.userId),
    uniqueIndex("master_code_uniq").on(t.masterCode),
    index("master_center_idx").on(t.centerId),
    index("master_level_idx").on(t.currentLevel),
    index("master_status_idx").on(t.status),
  ],
);

export const masterProfilesRelations = relations(
  masterProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [masterProfiles.userId],
      references: [users.id],
    }),
    center: one(centers, {
      fields: [masterProfiles.centerId],
      references: [centers.id],
    }),
    students: many(studentProfiles),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Course
// ─────────────────────────────────────────────────────────────────────────────

export const courses = createTable(
  "course",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    hours: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("course_name_idx").on(t.name)],
);

// ─────────────────────────────────────────────────────────────────────────────
// Student profile
// ─────────────────────────────────────────────────────────────────────────────

export const studentProfiles = createTable(
  "student_profile",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    masterId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => masterProfiles.id),
    centerId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => centers.id),
    studentCode: d.varchar({ length: 64 }),
    titleEn: d.varchar({ length: 64 }),
    fullNameEn: d.varchar({ length: 255 }),
    idOrPassport: d.varchar({ length: 64 }),
    courseId: d.varchar({ length: 255 }).references(() => courses.id),
    contentSubject: d.text(),
    academicPerformance: d.text(),
    completionDate: d.timestamp({ withTimezone: true }),

    instructorFullName: d.varchar({ length: 255 }),
    instructorAppointmentNumber: d.varchar({ length: 128 }),
    leadInstructorName: d.varchar({ length: 255 }),
    leadInstructorAppointmentNumber: d.varchar({ length: 128 }),
    leadSeniorName: d.varchar({ length: 255 }),
    leadSeniorAppointmentNumber: d.varchar({ length: 128 }),
    regionalDirectorName: d.varchar({ length: 255 }),
    regionalDirectorAppointmentNumber: d.varchar({ length: 128 }),

    studentIdCardUrl: d.varchar({ length: 1024 }),
    paymentSlipUrl: d.varchar({ length: 1024 }),
    applicationUrl: d.varchar({ length: 1024 }),
    photoUrl: d.varchar({ length: 1024 }),

    notes: d.text(),
    status: d
      .varchar({ length: 32 })
      .$type<EntityStatus>()
      .notNull()
      .default("pending_approval"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("student_user_uniq").on(t.userId),
    uniqueIndex("student_code_uniq").on(t.studentCode),
    index("student_master_idx").on(t.masterId),
    index("student_center_idx").on(t.centerId),
    index("student_status_idx").on(t.status),
  ],
);

export const studentProfilesRelations = relations(
  studentProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [studentProfiles.userId],
      references: [users.id],
    }),
    master: one(masterProfiles, {
      fields: [studentProfiles.masterId],
      references: [masterProfiles.id],
    }),
    center: one(centers, {
      fields: [studentProfiles.centerId],
      references: [centers.id],
    }),
    course: one(courses, {
      fields: [studentProfiles.courseId],
      references: [courses.id],
    }),
    certificateRequests: many(certificateRequests),
    certificates: many(certificates),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Certificate request + Certificate + Template
// ─────────────────────────────────────────────────────────────────────────────

export const certificateTemplates = createTable("certificate_template", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }).notNull(),
  definition: d.jsonb().notNull().default(sql`'{}'::jsonb`),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const certificateRequests = createTable(
  "certificate_request",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => studentProfiles.id),
    courseId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => courses.id),
    payload: d.jsonb().notNull().default(sql`'{}'::jsonb`),
    status: d
      .varchar({ length: 32 })
      .$type<EntityStatus>()
      .notNull()
      .default("pending_approval"),
    currentStep: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("cert_req_student_idx").on(t.studentId),
    index("cert_req_status_idx").on(t.status),
  ],
);

export const certificates = createTable(
  "certificate",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => studentProfiles.id),
    courseId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => courses.id),
    requestId: d
      .varchar({ length: 255 })
      .references(() => certificateRequests.id),
    templateId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => certificateTemplates.id),
    pdfUrl: d.varchar({ length: 1024 }),
    qrToken: d.varchar({ length: 128 }).notNull(),
    sharedSlug: d.varchar({ length: 128 }).notNull(),
    issuedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    issuedByUserId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
  }),
  (t) => [
    uniqueIndex("cert_slug_uniq").on(t.sharedSlug),
    uniqueIndex("cert_qr_uniq").on(t.qrToken),
    index("cert_student_idx").on(t.studentId),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Approval engine
// ─────────────────────────────────────────────────────────────────────────────

export const approvalSteps = createTable(
  "approval_step",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    targetType: d
      .varchar({ length: 32 })
      .$type<ApprovalTargetType>()
      .notNull(),
    targetId: d.varchar({ length: 255 }).notNull(),
    orderIndex: d.integer().notNull(),
    requiredRoleLevel: d.integer(),
    requiredKind: d.varchar({ length: 16 }).$type<RoleKind>().notNull(),
    requiredCenterId: d
      .varchar({ length: 255 })
      .references(() => centers.id),
    assignedUserId: d
      .varchar({ length: 255 })
      .references(() => users.id),
    decidedByUserId: d
      .varchar({ length: 255 })
      .references(() => users.id),
    status: d
      .varchar({ length: 16 })
      .$type<ApprovalStepStatus>()
      .notNull()
      .default("waiting"),
    comment: d.text(),
    decidedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("appr_target_idx").on(t.targetType, t.targetId),
    index("appr_status_idx").on(t.status),
    index("appr_assigned_idx").on(t.assignedUserId),
    index("appr_kind_level_center_idx").on(
      t.requiredKind,
      t.requiredRoleLevel,
      t.requiredCenterId,
    ),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Revenue ledger
// ─────────────────────────────────────────────────────────────────────────────

export const revenueLedger = createTable(
  "revenue_ledger",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    amountThb: d.numeric({ precision: 12, scale: 2 }).notNull(),
    sourceType: d.varchar({ length: 32 }).notNull(),
    sourceId: d.varchar({ length: 255 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("revenue_user_idx").on(t.userId),
    index("revenue_source_idx").on(t.sourceType, t.sourceId),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Calendar
// ─────────────────────────────────────────────────────────────────────────────

export const calendarEvents = createTable(
  "calendar_event",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    startsAt: d.timestamp({ withTimezone: true }).notNull(),
    endsAt: d.timestamp({ withTimezone: true }).notNull(),
    createdByUserId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("event_starts_idx").on(t.startsAt)],
);
