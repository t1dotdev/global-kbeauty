# Global K-Beauty — Implementation Plan

## 1. Overview
Multi-role certification platform. Roles: **Admin**, **Center**, **Master (dynamic levels 0…N)**, **Student**. Google OAuth only; everyone logs in first, then completes a role-specific registration form.

## 2. Stack
- Next.js 15 (App Router), TypeScript
- tRPC v11, Drizzle ORM, Postgres
- NextAuth v5 (Google provider only)
- TailwindCSS
- `react-hook-form` + `zod`
- `@tanstack/react-table`
- `next-intl` (EN default, KR)
- Cloudflare R2 via `@aws-sdk/client-s3` (presigned uploads)
- `@react-pdf/renderer` for certificates
- `lramos33/big-calendar` for calendar UI

## 3. Roles & Permissions

| Role | Created via | Approved by | Earns revenue | Notes |
|---|---|---|---|---|
| Admin | Manual DB edit | n/a | No | Full control |
| Center | `/register/center` after Google login | Admin (UI) | Yes (when approving) | Each center owns masters & students |
| Master Lv N | `/register/master` after Google login | Chain `Lv N+1 → … → Lv max → Center → Admin` | Yes | Belongs to one center |
| Student | `/register/student` after Google login | Lv 1 master only | n/a | Belongs to one master (and that master's center) |

**Certificate request** is a separate flow from student registration. Approved by `Master chain → Center → Admin`. Each non-admin approver earns `role.amountThb`. Admin earns nothing.

## 4. Auth Flow
1. User clicks Sign In on `/login` (Google).
2. NextAuth creates baseline `user` row with `role = null`, `status = pending_profile`.
3. Post-login middleware:
   - `role = admin` → `/dashboard/admin`
   - `role` set + profile complete → `/dashboard/{role}`
   - otherwise → `/register` selector (`student | master | center`)
4. Admin manually flips `users.role` in the DB to grant admin or override role assignments not handled by approvals.

## 5. Data Model (Drizzle, prefix `global-kbeauty_`)

- **role** — `id`, `name`, `description`, `amountThb` (numeric), `level` (int, nullable for `center`/`admin`), `kind` (`master` | `center` | `admin`).
- **user** (extend) — `roleId` fk (nullable), `status` (`pending_profile` | `pending_approval` | `approved` | `declined`), `preferredLocale` (`en` | `kr`).
- **center** — `id`, `code` (unique 3–4 char), director title/name, idCard, vocational field[], content[], appointmentDate, appointmentNumber, name, address, files (`idCardUrl`, `paymentSlipUrl`, `photoUrl`), `status`, `ownerUserId`.
- **master_profile** — `id`, `userId` fk, `centerId` fk, `masterCode`, Thai+English titles & names, `idCardNumber`, `completedCourse` (enum + free text), `certificateRequestDate`, `completionDate`, `idCardUrl`, `photoUrl`, `currentLevel`.
- **student_profile** — `id`, `userId` fk, `masterId` fk (denormalised `centerId`), `studentCode`, English title/full name, `idOrPassport`, `courseId` fk, `contentSubject`, `academicPerformance`, `completionDate`, instructor block (full name, appointment number, lead instructor name + appointment number, lead senior name + appointment number, regional center director + appointment number + name), files (`studentIdCardUrl`, `paymentSlipUrl`, `applicationUrl`, `photoUrl`), `notes`, `status`.
- **course** — `id`, `name`, `description`, `hours`.
- **certificate_request** — `id`, `studentId` fk, `courseId` fk, `payload` (JSON), `status`, `currentStep`, `createdAt`.
- **certificate** — `id`, `studentId` fk, `courseId` fk, `templateId` fk, `pdfUrl`, `qrToken`, `sharedSlug` (unique), `issuedAt`, `issuedByUserId`.
- **certificate_template** — `id`, `name`, `definition` (JSON).
- **approval_step** — `id`, `targetType` (`master` | `center` | `student` | `cert_request`), `targetId`, `orderIndex`, `requiredRoleLevel` (nullable), `requiredKind` (`master` | `center` | `admin`), `assignedUserId` (nullable), `status` (`waiting` | `active` | `approved` | `declined` | `skipped`), `comment`, `decidedAt`.
- **revenue_ledger** — `id`, `userId`, `amountThb`, `sourceType`, `sourceId`, `createdAt`.
- **calendar_event** — `id`, `title`, `description`, `startsAt`, `endsAt`, `createdByUserId`.

## 6. Identifier Scheme

System-generated, immutable, encodes hierarchy.

```
Center code:    GKB-CTR-<XXX>             e.g. GKB-CTR-BKK
Master code:    <CenterCode>-M<LL><NNN>   LL = level (2 digits), NNN = seq within center+level
Student code:   <MasterCode>-S<NNNN>      NNNN = seq within master
```

Examples:
- Center: `GKB-CTR-BKK`
- Master Lv 02 #007 in BKK: `GKB-CTR-BKK-M02007`
- Student #123 of that master: `GKB-CTR-BKK-M02007-S0123`

Generation:
- **Center code** chosen at admin-approval time (admin types the 3-char suffix).
- **Master code** allocated atomically when admin approves the master (last step of chain).
- **Student code** allocated when student is created and tied to their level-1 master.

Reading a student ID immediately reveals their center and master; "students in my center" is a prefix match.

## 7. Approval Engine

Generic table `approval_step` driven by per-target pipeline builders:

- **Master (Lv N, center C)** → `[Lv N+1 … Lv max in C, Center C, Admin]`.
- **Center** → `[Admin]`.
- **Student** → `[Lv 1 master in C tied to student's chosen master]`.
- **Certificate request** → `[student.master, Lv 2 … N in C, Center C, Admin]`.

Rules:
- Only the next `active` step is actionable. On approval, next `waiting` becomes `active`. On decline, the target moves to `declined` and the pipeline stops.
- Visibility: an approver sees their queue filtered by `status=active AND (kind=admin OR center=mine OR (kind=master AND center=mine AND level=mine))`. Upper masters can see and approve lower masters in the same center.
- Each non-admin approval writes a `revenue_ledger` row equal to the approver's `role.amountThb`.

## 8. Routes

| Path | Auth | Purpose |
|---|---|---|
| `/` | public | Logo home |
| `/login` | public | Google OAuth |
| `/register` | logged-in, no role | Choose student / master / center |
| `/register/student` | logged-in | Student form, pick master |
| `/register/master` | logged-in | Master form, pick center |
| `/register/center` | logged-in | Center form |
| `/dashboard/admin/{users,roles,courses,centers,masters,students,certificates,templates,calendar,approvals}` | admin | Admin features |
| `/dashboard/center/{approvals,masters,students,revenue,calendar}` | center | Center dashboard |
| `/dashboard/master/{approvals,students,revenue,calendar}` | master | Master dashboard (Lv 1 can CRUD students) |
| `/dashboard/student/{profile,certificates,request}` | student | Student dashboard |
| `/profile/[code]` | logged-in | View profile by center/master/student code |
| `/certificate/[slug]` | public | Shared certificate viewer |

## 9. tRPC Routers
`auth`, `user`, `role`, `center`, `master`, `student`, `course`, `approval`, `certificateRequest`, `certificate`, `template`, `calendar`, `revenue`, `search`, `upload` (R2 presign).

## 10. UI / Forms
- All three registration forms implement the full spec field set.
- Thai original labels are translated to EN/KR via `next-intl`; Thai source preserved as comments next to translation keys for traceability.
- File inputs validate ≤ 10MB and upload through R2 presigned PUT.
- Status badges: `pending`, `processing`, `approved`, `declined`.
- Tables (admin/master/center) support server-side filter and search by `code`, `name`, and `idCardNumber`.

## 11. Certificates
- Admin issues a certificate from an approved `certificate_request` using a `certificate_template`.
- Each certificate: PDF rendered with `@react-pdf/renderer`, stored in R2.
  - **Print**: print-optimised page.
  - **Share**: public route `/certificate/[slug]`.
  - **Download**: signed R2 URL.
- Multiple certificates per student supported (one per approved request).
- Templates store JSON definition + field map; the visual template will be supplied later by the user.

## 12. Calendar
- Integrate `lramos33/big-calendar` as a client component.
- Single global event feed (`calendar_event`); admin CRUD; all authenticated users read.

## 13. i18n
- `next-intl` with locales `en` (default) and `kr`.
- Locale switcher in header, persisted on `users.preferredLocale`.

## 14. Storage (Cloudflare R2)
- Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`.
- tRPC `upload.presign` issues a PUT URL; client uploads directly; server stores returned key.

## 15. Build Phases
1. Schema + migrations + seed (admin role, default center/master/admin role rows).
2. NextAuth Google + role-aware middleware + `/register` selector.
3. R2 presign upload utility.
4. Center / Master / Student registration forms.
5. Approval engine + per-role queues + revenue ledger.
6. Course CRUD + Student CRUD (admin & Lv 1 master).
7. Certificate request flow + certificate generation + share/print.
8. Calendar.
9. Search + profile pages by code.
10. i18n EN/KR.
11. Polish, tests, deploy.
