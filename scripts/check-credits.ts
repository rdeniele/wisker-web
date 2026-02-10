import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkCredits() {
  try {
    // Get all users with their credit info
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        credits: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
    });

    console.log("\n=== User Credits ===\n");
    for (const user of users) {
      console.log(`Email: ${user.email}`);
      console.log(`Credits: ${user.credits}`);
      console.log(`Plan: ${user.subscriptionPlan}`);
      console.log(`Status: ${user.subscriptionStatus}`);
      console.log("---");
    }

    console.log(`\nTotal users: ${users.length}\n`);
  } catch (error) {
    console.error("Error checking credits:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCredits();
