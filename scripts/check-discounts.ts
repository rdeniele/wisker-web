import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  console.log('Plans with discount info:\n');
  plans.forEach(p => {
    console.log(`${p.displayName}:`);
    console.log(`  Price: ₱${p.monthlyPrice}/mo | ₱${p.yearlyPrice}/year`);
    console.log(`  Credits: ${p.dailyCredits}/day`);
    if (p.discountPercent) {
      console.log(`  Discount: ${p.discountPercent}%`);
      console.log(`  Label: ${p.discountLabel}`);
      const originalMonthly = p.monthlyPrice / (1 - p.discountPercent / 100);
      const originalYearly = p.yearlyPrice / (1 - p.discountPercent / 100);
      console.log(`  Original: ₱${Math.round(originalMonthly)}/mo | ₱${Math.round(originalYearly)}/year`);
    }
    console.log('');
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
