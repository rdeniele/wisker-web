-- Apply promo tracking migration
-- Run this with: npx tsx scripts/apply-promo-migration.ts

import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    console.log('Applying promo tracking fields to users table...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "applied_promo_code" TEXT;
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promo_start_date" TIMESTAMP(3);
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promo_end_date" TIMESTAMP(3);
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promo_months_free" INTEGER;
    `);
    
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
