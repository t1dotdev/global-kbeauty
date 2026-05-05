CREATE TABLE "global-kbeauty_account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "global-kbeauty_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_approval_step" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"targetType" varchar(32) NOT NULL,
	"targetId" varchar(255) NOT NULL,
	"orderIndex" integer NOT NULL,
	"requiredRoleLevel" integer,
	"requiredKind" varchar(16) NOT NULL,
	"requiredCenterId" varchar(255),
	"assignedUserId" varchar(255),
	"decidedByUserId" varchar(255),
	"status" varchar(16) DEFAULT 'waiting' NOT NULL,
	"comment" text,
	"decidedAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_calendar_event" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"startsAt" timestamp with time zone NOT NULL,
	"endsAt" timestamp with time zone NOT NULL,
	"createdByUserId" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_center" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"ownerUserId" varchar(255) NOT NULL,
	"directorTitle" varchar(64),
	"directorName" varchar(255),
	"directorIdCard" varchar(64),
	"vocationalFields" text[] DEFAULT '{}'::text[] NOT NULL,
	"contents" text[] DEFAULT '{}'::text[] NOT NULL,
	"appointmentDate" timestamp with time zone,
	"appointmentNumber" varchar(128),
	"name" varchar(255) NOT NULL,
	"address" text,
	"idCardUrl" varchar(1024),
	"paymentSlipUrl" varchar(1024),
	"photoUrl" varchar(1024),
	"status" varchar(32) DEFAULT 'pending_approval' NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_certificate_request" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"studentId" varchar(255) NOT NULL,
	"courseId" varchar(255) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'pending_approval' NOT NULL,
	"currentStep" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_certificate_template" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"definition" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_certificate" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"studentId" varchar(255) NOT NULL,
	"courseId" varchar(255) NOT NULL,
	"requestId" varchar(255),
	"templateId" varchar(255) NOT NULL,
	"pdfUrl" varchar(1024),
	"qrToken" varchar(128) NOT NULL,
	"sharedSlug" varchar(128) NOT NULL,
	"issuedAt" timestamp with time zone NOT NULL,
	"issuedByUserId" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_course" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"hours" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_master_profile" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"centerId" varchar(255) NOT NULL,
	"masterCode" varchar(64),
	"titleTh" varchar(64),
	"firstNameTh" varchar(128),
	"lastNameTh" varchar(128),
	"titleEn" varchar(64),
	"firstNameEn" varchar(128),
	"lastNameEn" varchar(128),
	"idCardNumber" varchar(64),
	"completedCourse" varchar(128),
	"completedCourseOther" text,
	"certificateRequestDate" timestamp with time zone,
	"completionDate" timestamp with time zone,
	"idCardUrl" varchar(1024),
	"photoUrl" varchar(1024),
	"currentLevel" integer DEFAULT 1 NOT NULL,
	"desiredLevel" integer DEFAULT 1 NOT NULL,
	"status" varchar(32) DEFAULT 'pending_approval' NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_revenue_ledger" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"amountThb" numeric(12, 2) NOT NULL,
	"sourceType" varchar(32) NOT NULL,
	"sourceId" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_role" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"amountThb" numeric(12, 2) DEFAULT '0' NOT NULL,
	"level" integer,
	"kind" varchar(16) NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_student_profile" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"masterId" varchar(255) NOT NULL,
	"centerId" varchar(255) NOT NULL,
	"studentCode" varchar(64),
	"titleEn" varchar(64),
	"fullNameEn" varchar(255),
	"idOrPassport" varchar(64),
	"courseId" varchar(255),
	"contentSubject" text,
	"academicPerformance" text,
	"completionDate" timestamp with time zone,
	"instructorFullName" varchar(255),
	"instructorAppointmentNumber" varchar(128),
	"leadInstructorName" varchar(255),
	"leadInstructorAppointmentNumber" varchar(128),
	"leadSeniorName" varchar(255),
	"leadSeniorAppointmentNumber" varchar(128),
	"regionalDirectorName" varchar(255),
	"regionalDirectorAppointmentNumber" varchar(128),
	"studentIdCardUrl" varchar(1024),
	"paymentSlipUrl" varchar(1024),
	"applicationUrl" varchar(1024),
	"photoUrl" varchar(1024),
	"notes" text,
	"status" varchar(32) DEFAULT 'pending_approval' NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" varchar(255),
	"roleId" varchar(255),
	"status" varchar(32) DEFAULT 'pending_profile' NOT NULL,
	"preferredLocale" varchar(8) DEFAULT 'en' NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "global-kbeauty_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "global-kbeauty_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "global-kbeauty_account" ADD CONSTRAINT "global-kbeauty_account_userId_global-kbeauty_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."global-kbeauty_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_approval_step" ADD CONSTRAINT "global-kbeauty_approval_step_requiredCenterId_global-kbeauty_center_id_fk" FOREIGN KEY ("requiredCenterId") REFERENCES "public"."global-kbeauty_center"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_approval_step" ADD CONSTRAINT "global-kbeauty_approval_step_assignedUserId_global-kbeauty_user_id_fk" FOREIGN KEY ("assignedUserId") REFERENCES "public"."global-kbeauty_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_approval_step" ADD CONSTRAINT "global-kbeauty_approval_step_decidedByUserId_global-kbeauty_user_id_fk" FOREIGN KEY ("decidedByUserId") REFERENCES "public"."global-kbeauty_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_calendar_event" ADD CONSTRAINT "global-kbeauty_calendar_event_createdByUserId_global-kbeauty_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."global-kbeauty_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_center" ADD CONSTRAINT "global-kbeauty_center_ownerUserId_global-kbeauty_user_id_fk" FOREIGN KEY ("ownerUserId") REFERENCES "public"."global-kbeauty_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_certificate_request" ADD CONSTRAINT "global-kbeauty_certificate_request_studentId_global-kbeauty_student_profile_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."global-kbeauty_student_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_certificate_request" ADD CONSTRAINT "global-kbeauty_certificate_request_courseId_global-kbeauty_course_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."global-kbeauty_course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_certificate" ADD CONSTRAINT "global-kbeauty_certificate_studentId_global-kbeauty_student_profile_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."global-kbeauty_student_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_certificate" ADD CONSTRAINT "global-kbeauty_certificate_courseId_global-kbeauty_course_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."global-kbeauty_course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_certificate" ADD CONSTRAINT "global-kbeauty_certificate_requestId_global-kbeauty_certificate_request_id_fk" FOREIGN KEY ("requestId") REFERENCES "public"."global-kbeauty_certificate_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_certificate" ADD CONSTRAINT "global-kbeauty_certificate_templateId_global-kbeauty_certificate_template_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."global-kbeauty_certificate_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_certificate" ADD CONSTRAINT "global-kbeauty_certificate_issuedByUserId_global-kbeauty_user_id_fk" FOREIGN KEY ("issuedByUserId") REFERENCES "public"."global-kbeauty_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_master_profile" ADD CONSTRAINT "global-kbeauty_master_profile_userId_global-kbeauty_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."global-kbeauty_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_master_profile" ADD CONSTRAINT "global-kbeauty_master_profile_centerId_global-kbeauty_center_id_fk" FOREIGN KEY ("centerId") REFERENCES "public"."global-kbeauty_center"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_revenue_ledger" ADD CONSTRAINT "global-kbeauty_revenue_ledger_userId_global-kbeauty_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."global-kbeauty_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_session" ADD CONSTRAINT "global-kbeauty_session_userId_global-kbeauty_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."global-kbeauty_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_student_profile" ADD CONSTRAINT "global-kbeauty_student_profile_userId_global-kbeauty_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."global-kbeauty_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_student_profile" ADD CONSTRAINT "global-kbeauty_student_profile_masterId_global-kbeauty_master_profile_id_fk" FOREIGN KEY ("masterId") REFERENCES "public"."global-kbeauty_master_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_student_profile" ADD CONSTRAINT "global-kbeauty_student_profile_centerId_global-kbeauty_center_id_fk" FOREIGN KEY ("centerId") REFERENCES "public"."global-kbeauty_center"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_student_profile" ADD CONSTRAINT "global-kbeauty_student_profile_courseId_global-kbeauty_course_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."global-kbeauty_course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global-kbeauty_user" ADD CONSTRAINT "global-kbeauty_user_roleId_global-kbeauty_role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."global-kbeauty_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "global-kbeauty_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "appr_target_idx" ON "global-kbeauty_approval_step" USING btree ("targetType","targetId");--> statement-breakpoint
CREATE INDEX "appr_status_idx" ON "global-kbeauty_approval_step" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appr_assigned_idx" ON "global-kbeauty_approval_step" USING btree ("assignedUserId");--> statement-breakpoint
CREATE INDEX "appr_kind_level_center_idx" ON "global-kbeauty_approval_step" USING btree ("requiredKind","requiredRoleLevel","requiredCenterId");--> statement-breakpoint
CREATE INDEX "event_starts_idx" ON "global-kbeauty_calendar_event" USING btree ("startsAt");--> statement-breakpoint
CREATE UNIQUE INDEX "center_code_uniq" ON "global-kbeauty_center" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "center_owner_uniq" ON "global-kbeauty_center" USING btree ("ownerUserId");--> statement-breakpoint
CREATE INDEX "center_status_idx" ON "global-kbeauty_center" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cert_req_student_idx" ON "global-kbeauty_certificate_request" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "cert_req_status_idx" ON "global-kbeauty_certificate_request" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "cert_slug_uniq" ON "global-kbeauty_certificate" USING btree ("sharedSlug");--> statement-breakpoint
CREATE UNIQUE INDEX "cert_qr_uniq" ON "global-kbeauty_certificate" USING btree ("qrToken");--> statement-breakpoint
CREATE INDEX "cert_student_idx" ON "global-kbeauty_certificate" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "course_name_idx" ON "global-kbeauty_course" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "master_user_uniq" ON "global-kbeauty_master_profile" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "master_code_uniq" ON "global-kbeauty_master_profile" USING btree ("masterCode");--> statement-breakpoint
CREATE INDEX "master_center_idx" ON "global-kbeauty_master_profile" USING btree ("centerId");--> statement-breakpoint
CREATE INDEX "master_level_idx" ON "global-kbeauty_master_profile" USING btree ("currentLevel");--> statement-breakpoint
CREATE INDEX "master_status_idx" ON "global-kbeauty_master_profile" USING btree ("status");--> statement-breakpoint
CREATE INDEX "revenue_user_idx" ON "global-kbeauty_revenue_ledger" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "revenue_source_idx" ON "global-kbeauty_revenue_ledger" USING btree ("sourceType","sourceId");--> statement-breakpoint
CREATE UNIQUE INDEX "role_kind_level_uniq" ON "global-kbeauty_role" USING btree ("kind","level");--> statement-breakpoint
CREATE INDEX "role_kind_idx" ON "global-kbeauty_role" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "t_user_id_idx" ON "global-kbeauty_session" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "student_user_uniq" ON "global-kbeauty_student_profile" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "student_code_uniq" ON "global-kbeauty_student_profile" USING btree ("studentCode");--> statement-breakpoint
CREATE INDEX "student_master_idx" ON "global-kbeauty_student_profile" USING btree ("masterId");--> statement-breakpoint
CREATE INDEX "student_center_idx" ON "global-kbeauty_student_profile" USING btree ("centerId");--> statement-breakpoint
CREATE INDEX "student_status_idx" ON "global-kbeauty_student_profile" USING btree ("status");