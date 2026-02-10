import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkLearningTools() {
  const tools = await prisma.learningTool.findMany({
    select: { 
      id: true, 
      type: true, 
      createdAt: true 
    },
    orderBy: { createdAt: 'desc' }
  });

  const summary = tools.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Learning Tools Summary:');
  Object.entries(summary).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log(`\nTotal: ${tools.length}`);
  
  await prisma.$disconnect();
  process.exit(0);
}

checkLearningTools().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
