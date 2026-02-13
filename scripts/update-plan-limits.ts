/**
 * Update Plan Limits Script
 * Updates plan definitions in the database with the new limits
 *
 * Usage: npx tsx scripts/update-plan-limits.ts
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

async function updatePlanLimits() {
  try {
    console.log("🔄 Updating plan limits in database...\n");

    // Update FREE plan
    const freePlan = await prisma.plan.updateMany({
      where: { planType: PlanType.FREE },
      data: {
        dailyCredits: 10,
        notesLimit: 25,
        subjectsLimit: 5,
      },
    });
    console.log(`✓ Updated FREE plan (${freePlan.count} records)`);

    // Update PRO plan
    const proPlan = await prisma.plan.updateMany({
      where: { planType: PlanType.PRO },
      data: {
        monthlyPrice: 80,
        yearlyPrice: 480,
        dailyCredits: 300,
        notesLimit: 300,
        subjectsLimit: 30,
      },
    });
    console.log(`✓ Updated PRO plan (${proPlan.count} records)`);

    // Update PREMIUM plan
    const premiumPlan = await prisma.plan.updateMany({
      where: { planType: PlanType.PREMIUM },
      data: {
        monthlyPrice: 120,
        yearlyPrice: 960,
        dailyCredits: 1500,
        notesLimit: -1,
        subjectsLimit: -1,
      },
    });
    console.log(`✓ Updated PREMIUM plan (${premiumPlan.count} records)`);

    // Display current plans
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: "asc" },
    });

    console.log("\n📊 Current Plans:\n");
    plans.forEach((plan) => {
      console.log(`${plan.displayName} (${plan.planType}):`);
      console.log(`  Subjects: ${plan.subjectsLimit === -1 ? "Unlimited" : plan.subjectsLimit}`);
      console.log(`  Notes: ${plan.notesLimit === -1 ? "Unlimited" : plan.notesLimit}`);
      console.log(`  Credits: ${plan.dailyCredits}/day`);
      console.log(`  Price: ₱${plan.monthlyPrice}/mo or ₱${plan.yearlyPrice}/year`);
      if (plan.discountLabel) {
        console.log(`  Discount: ${plan.discountLabel}`);
      }
      console.log("");
    });

    console.log("✅ Plans updated successfully!");

  } catch (error) {
    console.error("❌ Error updating plans:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePlanLimits();
