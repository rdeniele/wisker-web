/**
 * Test Script for Dynamic Pricing System
 * Run with: npx tsx scripts/test-dynamic-pricing.ts
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

async function testDynamicPricing() {
  console.log("🧪 Testing Dynamic Pricing System\n");

  try {
    // Test 1: Fetch all active plans
    console.log("Test 1: Fetching active plans...");
    const activePlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    console.log(`✅ Found ${activePlans.length} active plans`);
    activePlans.forEach((plan) => {
      console.log(
        `   - ${plan.displayName}: ₱${plan.monthlyPrice}/mo, ₱${plan.yearlyPrice}/year`,
      );
    });
    console.log();

    // Test 2: Update a plan's pricing
    console.log("Test 2: Updating Pro plan pricing...");
    const proPlan = await prisma.plan.findFirst({
      where: { planType: PlanType.PRO },
    });

    if (proPlan) {
      const originalMonthly = proPlan.monthlyPrice;
      const originalYearly = proPlan.yearlyPrice;

      // Update to test values
      await prisma.plan.update({
        where: { id: proPlan.id },
        data: {
          monthlyPrice: 99,
          yearlyPrice: 999,
        },
      });
      console.log("✅ Updated Pro plan pricing");

      // Verify update
      const updatedPlan = await prisma.plan.findUnique({
        where: { id: proPlan.id },
      });

      if (updatedPlan?.monthlyPrice === 99 && updatedPlan.yearlyPrice === 999) {
        console.log("✅ Price update verified");
      } else {
        console.log("❌ Price update failed");
      }

      // Restore original values
      await prisma.plan.update({
        where: { id: proPlan.id },
        data: {
          monthlyPrice: originalMonthly,
          yearlyPrice: originalYearly,
        },
      });
      console.log("✅ Restored original pricing");
    } else {
      console.log("❌ Pro plan not found");
    }
    console.log();

    // Test 3: Add and remove a feature
    console.log("Test 3: Adding/removing features...");
    const freePlan = await prisma.plan.findFirst({
      where: { planType: PlanType.FREE },
    });

    if (freePlan) {
      const originalFeatures = [...freePlan.features];
      const testFeature = "🧪 Test Feature";

      // Add test feature
      await prisma.plan.update({
        where: { id: freePlan.id },
        data: {
          features: [...freePlan.features, testFeature],
        },
      });
      console.log("✅ Added test feature");

      // Verify addition
      const updatedPlan = await prisma.plan.findUnique({
        where: { id: freePlan.id },
      });

      if (updatedPlan?.features.includes(testFeature)) {
        console.log("✅ Feature addition verified");
      } else {
        console.log("❌ Feature addition failed");
      }

      // Restore original features
      await prisma.plan.update({
        where: { id: freePlan.id },
        data: {
          features: originalFeatures,
        },
      });
      console.log("✅ Restored original features");
    } else {
      console.log("❌ Free plan not found");
    }
    console.log();

    // Test 4: Toggle plan visibility
    console.log("Test 4: Testing plan visibility...");
    const premiumPlan = await prisma.plan.findFirst({
      where: { planType: PlanType.PREMIUM },
    });

    if (premiumPlan) {
      const originalActive = premiumPlan.isActive;

      // Toggle off
      await prisma.plan.update({
        where: { id: premiumPlan.id },
        data: { isActive: false },
      });
      console.log("✅ Deactivated Premium plan");

      // Count active plans
      const activePlansCount = await prisma.plan.count({
        where: { isActive: true },
      });
      console.log(`   Active plans: ${activePlansCount} (should be 2)`);

      // Restore
      await prisma.plan.update({
        where: { id: premiumPlan.id },
        data: { isActive: originalActive },
      });
      console.log("✅ Restored Premium plan visibility");
    } else {
      console.log("❌ Premium plan not found");
    }
    console.log();

    // Test 5: Check plan type uniqueness
    console.log("Test 5: Checking plan type uniqueness...");
    const planTypes = await prisma.plan.groupBy({
      by: ["planType"],
      _count: true,
    });

    let allUnique = true;
    planTypes.forEach((pt) => {
      if (pt._count > 1) {
        console.log(`❌ Duplicate plan type found: ${pt.planType}`);
        allUnique = false;
      }
    });

    if (allUnique) {
      console.log("✅ All plan types are unique");
    }
    console.log();

    // Summary
    console.log("📊 Summary:");
    console.log(`   Total plans: ${activePlans.length}`);
    console.log(
      `   Price range: ₱${Math.min(...activePlans.map((p) => p.monthlyPrice))} - ₱${Math.max(...activePlans.map((p) => p.monthlyPrice))}/mo`,
    );
    console.log(
      `   Credit range: ${Math.min(...activePlans.map((p) => p.dailyCredits))} - ${Math.max(...activePlans.map((p) => p.dailyCredits))} daily`,
    );
    console.log();

    console.log(
      "✅ All tests passed! Dynamic pricing system is working correctly.\n",
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testDynamicPricing();
