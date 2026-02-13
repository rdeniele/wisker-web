/**
 * Prisma Seed Script
 * Populates the database with initial plan data
 */

import { PrismaClient, PlanType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database with plans...");

  // Clear existing plans (optional - comment out if you don't want to reset)
  await prisma.plan.deleteMany({});
  console.log("  Cleared existing plans");

  // Create FREE plan
  const freePlan = await prisma.plan.upsert({
    where: { planType: PlanType.FREE },
    update: {},
    create: {
      name: "free",
      planType: PlanType.FREE,
      displayName: "Free",
      description: "Perfect for getting started with Wisker",
      monthlyPrice: 0,
      yearlyPrice: 0,
      dailyCredits: 10,
      notesLimit: 25,
      subjectsLimit: 5,
      features: [
        "10 daily credits (fur real)",
        "AI Cat Quizzes (purr-fect your smarts)",
        "AI Flashcat Cards (study on fleek)",
        "AI Cat-nnected Concept Maps (big brain energy)",
      ],
      isActive: true,
      sortOrder: 1,
      isMostPopular: false,
    },
  });
  console.log("  ✓ Created FREE plan");

  // Create PRO plan
  const proPlan = await prisma.plan.upsert({
    where: { planType: PlanType.PRO },
    update: {},
    create: {
      name: "pro",
      planType: PlanType.PRO,
      displayName: "Pro",
      description: "For serious students who want more",
      monthlyPrice: 80, // ₱80/month (₱960/year ÷ 12)
      yearlyPrice: 480, // ₱480/year (₱960 with 50% off + annual discount)
      dailyCredits: 300,
      notesLimit: 300,
      subjectsLimit: 30,
      features: [
        "300 daily credits (no cap)",
        "AI Cat Quizzes (flex your whiskers)",
        "AI Flashcat Cards (study glow-up)",
        "AI Cat-nnected Concept Maps (mega mind mode)",
        "Catnap Study Schedules (plan your catnaps)",
        "Advanced analytics (stats for days)",
        "Priority support (VIP paws only)",
      ],
      isActive: true,
      sortOrder: 2,
      isMostPopular: true,
      discountPercent: 50,
      discountLabel: "50% OFF for First 50 Users",
    },
  });
  console.log("  ✓ Created PRO plan");

  // Create PREMIUM plan
  const premiumPlan = await prisma.plan.upsert({
    where: { planType: PlanType.PREMIUM },
    update: {},
    create: {
      name: "premium",
      planType: PlanType.PREMIUM,
      displayName: "Premium",
      description: "The ultimate learning experience",
      monthlyPrice: 120, // ₱120/month (₱1,920/year ÷ 12)
      yearlyPrice: 960, // ₱960/year (₱1,920 with 50% off + annual discount)
      dailyCredits: 1500,
      notesLimit: -1, // Unlimited
      subjectsLimit: -1, // Unlimited
      features: [
        "1500 daily credits (max catitude)",
        "All Pro perks, but supercharged",
        "Early access to new drops (first dibs, always)",
        "Dedicated Cat Manager (your own hype human)",
        "Custom integrations (make it your vibe)",
      ],
      isActive: true,
      sortOrder: 3,
      isMostPopular: false,
      discountPercent: 50,
      discountLabel: "50% OFF for First 50 Users",
    },
  });
  console.log("  ✓ Created PREMIUM plan");

  console.log("✅ Database seeding completed!");
  console.log("\nCreated plans:");
  console.log(`  - ${freePlan.displayName}: Free`);
  console.log(
    `  - ${proPlan.displayName}: ₱${proPlan.monthlyPrice}/mo or ₱${proPlan.yearlyPrice}/year`,
  );
  console.log(
    `  - ${premiumPlan.displayName}: ₱${premiumPlan.monthlyPrice}/mo or ₱${premiumPlan.yearlyPrice}/year`,
  );
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
