/**
 * Quick test to check if plans exist in database
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured');
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkPlans() {
  try {
    console.log('Checking plans in database...\n');
    
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    if (plans.length === 0) {
      console.log('❌ No plans found in database!');
      console.log('Run: npm run prisma:seed\n');
    } else {
      console.log(`✅ Found ${plans.length} plans:\n`);
      plans.forEach(plan => {
        console.log(`  ${plan.isActive ? '✅' : '❌'} ${plan.displayName} (${plan.planType})`);
        console.log(`     Monthly: ₱${plan.monthlyPrice} | Yearly: ₱${plan.yearlyPrice}`);
      });
    }

    console.log();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkPlans();
