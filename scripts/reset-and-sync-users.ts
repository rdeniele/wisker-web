import { config } from "dotenv";
import { prisma } from "../src/lib/prisma";

// Load environment variables
config();

async function resetAndSync() {
  try {
    console.log("Resetting user database...\n");

    // Delete all users
    const deleted = await prisma.user.deleteMany({});
    console.log(`✓ Deleted ${deleted.count} users\n`);

    // Create users with correct Supabase IDs
    const users = [
      {
        id: "4a9f0ec6-8851-4712-9e3b-de247311ddb6",
        email: "rondenielep13@gmail.com",
      },
      {
        id: "2eef347c-6b4a-41e0-a41c-cbcc7990fb8e",
        email: "poyhidalgo@gmail.com",
      },
    ];

    console.log("Creating users with correct Supabase IDs...\n");

    for (const userData of users) {
      const user = await prisma.user.create({
        data: {
          id: userData.id,
          email: userData.email,
          planType: "FREE",
          notesLimit: 50,
          subjectsLimit: 10,
          aiUsageLimit: 100,
          aiUsageCount: 0,
        },
      });
      console.log(`✓ Created: ${user.email} (${user.id})`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✓ Reset and sync complete!\n");
  } catch (error) {
    console.error("✗ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAndSync();
