/**
 * Update User Limits Script
 * Updates all existing users to have the correct limits based on their plan type
 *
 * Usage: npx tsx scripts/update-user-limits.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PlanType } from "@prisma/client";
import pg from "pg";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PLAN_LIMITS = {
  FREE: {
    notesLimit: 25,
    subjectsLimit: 5,
    dailyCredits: 10,
  },
  PRO: {
    notesLimit: 300,
    subjectsLimit: 30,
    dailyCredits: 300,
  },
  PREMIUM: {
    notesLimit: -1, // Unlimited
    subjectsLimit: -1, // Unlimited
    dailyCredits: 1500,
  },
};

async function updateUserLimits() {
  try {
    console.log("🔄 Updating user limits based on plan types...\n");

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        planType: true,
        notesLimit: true,
        subjectsLimit: true,
        dailyCredits: true,
      },
    });

    console.log(`Found ${users.length} users\n`);

    let updatedCount = 0;

    for (const user of users) {
      const limits = PLAN_LIMITS[user.planType];
      
      // Check if user needs updating
      if (
        user.notesLimit !== limits.notesLimit ||
        user.subjectsLimit !== limits.subjectsLimit ||
        user.dailyCredits !== limits.dailyCredits
      ) {
        console.log(`Updating ${user.email} (${user.planType}):`);
        console.log(`  Old: ${user.subjectsLimit} subjects, ${user.notesLimit} notes, ${user.dailyCredits} credits`);
        console.log(`  New: ${limits.subjectsLimit} subjects, ${limits.notesLimit} notes, ${limits.dailyCredits} credits`);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            notesLimit: limits.notesLimit,
            subjectsLimit: limits.subjectsLimit,
            dailyCredits: limits.dailyCredits,
          },
        });

        updatedCount++;
        console.log(`  ✓ Updated\n`);
      } else {
        console.log(`✓ ${user.email} (${user.planType}) - already up to date`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} users`);
    console.log(`✓ ${users.length - updatedCount} users were already up to date`);

  } catch (error) {
    console.error("❌ Error updating user limits:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserLimits();
