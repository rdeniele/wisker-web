-- Admin dashboard: activity tracking, payment ledger, audit log, account
-- suspension and the indexes the analytics queries rely on.
-- Everything here is additive and idempotent.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: account suspension
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspended_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspended_reason" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_activity" (
    "user_id" TEXT NOT NULL,
    "hour_start" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("user_id","hour_start")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'paymongo',
    "external_id" TEXT NOT NULL,
    "checkout_id" TEXT,
    "status" "PaymentStatus" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "plan_type" "PlanType",
    "billing_period" TEXT,
    "promo_code" TEXT,
    "failure_reason" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_email" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "target_label" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_activity_hour_start_idx" ON "user_activity"("hour_start");
CREATE UNIQUE INDEX IF NOT EXISTS "payment_transactions_external_id_key" ON "payment_transactions"("external_id");
CREATE INDEX IF NOT EXISTS "payment_transactions_occurred_at_idx" ON "payment_transactions"("occurred_at");
CREATE INDEX IF NOT EXISTS "payment_transactions_status_occurred_at_idx" ON "payment_transactions"("status", "occurred_at");
CREATE INDEX IF NOT EXISTS "payment_transactions_user_id_occurred_at_idx" ON "payment_transactions"("user_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_target_type_target_id_created_at_idx" ON "admin_audit_logs"("target_type", "target_id", "created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_actor_email_created_at_idx" ON "admin_audit_logs"("actor_email", "created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_action_created_at_idx" ON "admin_audit_logs"("action", "created_at");

-- Indexes for time-range analytics on existing tables
CREATE INDEX IF NOT EXISTS "users_plan_type_subscription_status_idx" ON "users"("plan_type", "subscription_status");
CREATE INDEX IF NOT EXISTS "users_subscription_start_date_idx" ON "users"("subscription_start_date");
CREATE INDEX IF NOT EXISTS "users_subscription_end_date_idx" ON "users"("subscription_end_date");
CREATE INDEX IF NOT EXISTS "users_last_activity_date_idx" ON "users"("last_activity_date");
CREATE INDEX IF NOT EXISTS "subjects_created_at_idx" ON "subjects"("created_at");
CREATE INDEX IF NOT EXISTS "notes_created_at_idx" ON "notes"("created_at");
CREATE INDEX IF NOT EXISTS "learning_tools_created_at_idx" ON "learning_tools"("created_at");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- These tables are server-only. Enabling RLS with no policies denies every
-- Supabase client role (anon / authenticated); the app reaches them through
-- the server-side Prisma connection, which bypasses RLS.
ALTER TABLE "user_activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_audit_logs" ENABLE ROW LEVEL SECURITY;
