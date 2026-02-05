import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function seedPromoCodes() {
  console.log("🎉 Seeding promo codes...");

  // Product Hunt promo code
  const productHuntPromo = await prisma.promoCode.upsert({
    where: { code: "EARLYCAT50" },
    update: {},
    create: {
      code: "EARLYCAT50",
      description: "3 months free for Product Hunt users",
      discountType: "MONTHS_FREE",
      discountValue: 3,
      maxUses: null, // unlimited
      expiresAt: new Date("2026-08-07"), // August 7th, 2026
      applicablePlans: [], // applies to all plans
      isActive: true,
    },
  });

  console.log("✅ Product Hunt promo code created:", productHuntPromo.code);

  // Optional: Create a backup promo code
  const welcomePromo = await prisma.promoCode.upsert({
    where: { code: "WELCOME20" },
    update: {},
    create: {
      code: "WELCOME20",
      description: "20% off for new users",
      discountType: "PERCENTAGE",
      discountValue: 20,
      maxUses: 100,
      expiresAt: null, // no expiration
      applicablePlans: [],
      isActive: true,
    },
  });

  console.log("✅ Welcome promo code created:", welcomePromo.code);

  console.log("\n✨ Promo codes seeded successfully!");
}

seedPromoCodes()
  .catch((e) => {
    console.error("Error seeding promo codes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
