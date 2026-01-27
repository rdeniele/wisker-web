-- AlterTable
ALTER TABLE "users" ADD "accepted_terms" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD "accepted_privacy" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD "terms_accepted_at" TIMESTAMP(3);
ALTER TABLE "users" ADD "privacy_accepted_at" TIMESTAMP(3);
