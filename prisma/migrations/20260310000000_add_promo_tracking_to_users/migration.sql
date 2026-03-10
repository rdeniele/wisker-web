-- AlterTable
ALTER TABLE "users" ADD COLUMN "applied_promo_code" TEXT,
ADD COLUMN "promo_start_date" TIMESTAMP(3),
ADD COLUMN "promo_end_date" TIMESTAMP(3),
ADD COLUMN "promo_months_free" INTEGER;
