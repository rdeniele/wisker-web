/**
 * Quick Pricing Update Script
 * Provides common tasks for updating plan pricing
 *
 * Usage: npx tsx scripts/update-pricing.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PlanType } from "@prisma/client";
import pg from "pg";
import "dotenv/config";
import * as readline from "readline";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function showMenu() {
  console.clear();
  console.log("╔════════════════════════════════════════╗");
  console.log("║     Wisker Pricing Manager 💰         ║");
  console.log("╚════════════════════════════════════════╝\n");
  console.log("What would you like to do?\n");
  console.log("  1. View all plans");
  console.log("  2. Update Pro plan pricing");
  console.log("  3. Update Premium plan pricing");
  console.log("  4. Add a promotional discount");
  console.log("  5. Remove all discounts");
  console.log("  6. Add a feature to a plan");
  console.log("  7. Toggle plan visibility");
  console.log("  8. Reset to default pricing");
  console.log("  0. Exit\n");
}

async function viewPlans() {
  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
  });

  console.log("\n📊 Current Plans:\n");
  plans.forEach((plan) => {
    console.log(
      `${plan.isActive ? "✅" : "❌"} ${plan.displayName} (${plan.planType})`,
    );
    console.log(
      `   Monthly: ₱${plan.monthlyPrice} | Yearly: ₱${plan.yearlyPrice}`,
    );
    console.log(`   Credits: ${plan.dailyCredits}/day`);
    if (plan.discountLabel) {
      console.log(
        `   Discount: ${plan.discountLabel} (${plan.discountPercent}%)`,
      );
    }
    console.log(`   Features: ${plan.features.length} items`);
    console.log("");
  });

  await question("Press Enter to continue...");
}

async function updateProPricing() {
  const plan = await prisma.plan.findFirst({
    where: { planType: PlanType.PRO },
  });

  if (!plan) {
    console.log("\n❌ Pro plan not found!");
    await question("Press Enter to continue...");
    return;
  }

  console.log(`\nCurrent Pro pricing:`);
  console.log(`  Monthly: ₱${plan.monthlyPrice}`);
  console.log(`  Yearly: ₱${plan.yearlyPrice}\n`);

  const monthly = await question(
    "Enter new monthly price (or press Enter to skip): ",
  );
  const yearly = await question(
    "Enter new yearly price (or press Enter to skip): ",
  );

  const updates: { monthlyPrice?: number; yearlyPrice?: number } = {};
  if (monthly) updates.monthlyPrice = parseFloat(monthly);
  if (yearly) updates.yearlyPrice = parseFloat(yearly);

  if (Object.keys(updates).length === 0) {
    console.log("\n⚠️  No changes made.");
    await question("Press Enter to continue...");
    return;
  }

  await prisma.plan.update({
    where: { id: plan.id },
    data: updates,
  });

  console.log("\n✅ Pro plan pricing updated!");
  await question("Press Enter to continue...");
}

async function updatePremiumPricing() {
  const plan = await prisma.plan.findFirst({
    where: { planType: PlanType.PREMIUM },
  });

  if (!plan) {
    console.log("\n❌ Premium plan not found!");
    await question("Press Enter to continue...");
    return;
  }

  console.log(`\nCurrent Premium pricing:`);
  console.log(`  Monthly: ₱${plan.monthlyPrice}`);
  console.log(`  Yearly: ₱${plan.yearlyPrice}\n`);

  const monthly = await question(
    "Enter new monthly price (or press Enter to skip): ",
  );
  const yearly = await question(
    "Enter new yearly price (or press Enter to skip): ",
  );

  const updates: { monthlyPrice?: number; yearlyPrice?: number } = {};
  if (monthly) updates.monthlyPrice = parseFloat(monthly);
  if (yearly) updates.yearlyPrice = parseFloat(yearly);

  if (Object.keys(updates).length === 0) {
    console.log("\n⚠️  No changes made.");
    await question("Press Enter to continue...");
    return;
  }

  await prisma.plan.update({
    where: { id: plan.id },
    data: updates,
  });

  console.log("\n✅ Premium plan pricing updated!");
  await question("Press Enter to continue...");
}

async function addDiscount() {
  console.log("\nWhich plan?\n");
  console.log("  1. Pro");
  console.log("  2. Premium");
  console.log("  3. Both\n");

  const choice = await question("Choice: ");
  const percent = await question(
    "Discount percentage (e.g., 50 for 50% off): ",
  );
  const label = await question('Discount label (e.g., "Black Friday Sale"): ');

  const updates = {
    discountPercent: parseFloat(percent),
    discountLabel: label || `${percent}% OFF`,
  };

  if (choice === "1" || choice === "3") {
    const proPlan = await prisma.plan.findFirst({
      where: { planType: PlanType.PRO },
    });
    if (proPlan) {
      await prisma.plan.update({
        where: { id: proPlan.id },
        data: updates,
      });
      console.log("✅ Discount applied to Pro plan");
    }
  }

  if (choice === "2" || choice === "3") {
    const premiumPlan = await prisma.plan.findFirst({
      where: { planType: PlanType.PREMIUM },
    });
    if (premiumPlan) {
      await prisma.plan.update({
        where: { id: premiumPlan.id },
        data: updates,
      });
      console.log("✅ Discount applied to Premium plan");
    }
  }

  await question("\nPress Enter to continue...");
}

async function removeDiscounts() {
  await prisma.plan.updateMany({
    data: {
      discountPercent: null,
      discountLabel: null,
    },
  });

  console.log("\n✅ All discounts removed!");
  await question("Press Enter to continue...");
}

async function addFeature() {
  const plans = await prisma.plan.findMany({
    where: { planType: { not: PlanType.FREE } },
    orderBy: { sortOrder: "asc" },
  });

  console.log("\nWhich plan?\n");
  plans.forEach((plan, idx) => {
    console.log(`  ${idx + 1}. ${plan.displayName}`);
  });
  console.log("");

  const choice = await question("Choice: ");
  const planIndex = parseInt(choice) - 1;

  if (planIndex < 0 || planIndex >= plans.length) {
    console.log("\n❌ Invalid choice!");
    await question("Press Enter to continue...");
    return;
  }

  const plan = plans[planIndex];
  const feature = await question("\nEnter new feature: ");

  if (!feature.trim()) {
    console.log("\n❌ Feature cannot be empty!");
    await question("Press Enter to continue...");
    return;
  }

  await prisma.plan.update({
    where: { id: plan.id },
    data: {
      features: [...plan.features, feature],
    },
  });

  console.log(`\n✅ Feature added to ${plan.displayName}!`);
  await question("Press Enter to continue...");
}

async function toggleVisibility() {
  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
  });

  console.log("\nWhich plan?\n");
  plans.forEach((plan, idx) => {
    console.log(
      `  ${idx + 1}. ${plan.displayName} (${plan.isActive ? "Active" : "Inactive"})`,
    );
  });
  console.log("");

  const choice = await question("Choice: ");
  const planIndex = parseInt(choice) - 1;

  if (planIndex < 0 || planIndex >= plans.length) {
    console.log("\n❌ Invalid choice!");
    await question("Press Enter to continue...");
    return;
  }

  const plan = plans[planIndex];
  await prisma.plan.update({
    where: { id: plan.id },
    data: {
      isActive: !plan.isActive,
    },
  });

  console.log(
    `\n✅ ${plan.displayName} is now ${!plan.isActive ? "Active" : "Inactive"}!`,
  );
  await question("Press Enter to continue...");
}

async function resetPricing() {
  const confirm = await question(
    "\n⚠️  This will reset all plans to default values. Continue? (yes/no): ",
  );

  if (confirm.toLowerCase() !== "yes") {
    console.log("\n❌ Cancelled.");
    await question("Press Enter to continue...");
    return;
  }

  // Update Pro
  await prisma.plan.updateMany({
    where: { planType: PlanType.PRO },
    data: {
      monthlyPrice: 50,
      yearlyPrice: 480,
      dailyCredits: 300,
      discountPercent: 50,
      discountLabel: "50% OFF for First 50 Users",
      isActive: true,
    },
  });

  // Update Premium
  await prisma.plan.updateMany({
    where: { planType: PlanType.PREMIUM },
    data: {
      monthlyPrice: 100,
      yearlyPrice: 960,
      dailyCredits: 1500,
      discountPercent: 50,
      discountLabel: "50% OFF for First 50 Users",
      isActive: true,
    },
  });

  console.log("\n✅ All plans reset to default pricing!");
  await question("Press Enter to continue...");
}

async function main() {
  try {
    while (true) {
      await showMenu();
      const choice = await question("Enter your choice: ");

      switch (choice) {
        case "1":
          await viewPlans();
          break;
        case "2":
          await updateProPricing();
          break;
        case "3":
          await updatePremiumPricing();
          break;
        case "4":
          await addDiscount();
          break;
        case "5":
          await removeDiscounts();
          break;
        case "6":
          await addFeature();
          break;
        case "7":
          await toggleVisibility();
          break;
        case "8":
          await resetPricing();
          break;
        case "0":
          console.log("\n👋 Goodbye!\n");
          rl.close();
          await prisma.$disconnect();
          await pool.end();
          process.exit(0);
        default:
          console.log("\n❌ Invalid choice!");
          await question("Press Enter to continue...");
      }
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    rl.close();
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }
}

main();
