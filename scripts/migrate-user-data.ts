import { config } from "dotenv";
import { prisma } from "../src/lib/prisma";

// Load environment variables
config();

async function migrateUserData() {
  try {
    console.log(
      "Migrating data from old user ID to correct Supabase user ID...\n",
    );

    const oldUserId = "85265d4a-5fc7-4f74-b0af-a70ec412bd3a"; // Old Prisma user
    const newUserId = "4a9f0ec6-8851-4712-9e3b-de247311ddb6"; // Correct Supabase user

    // Get old user data
    const oldUser = await prisma.user.findUnique({
      where: { id: oldUserId },
      include: {
        subjects: true,
      },
    });

    if (!oldUser) {
      console.log("Old user not found");
      return;
    }

    console.log(`Old user: ${oldUser.email}`);
    console.log(`  - ${oldUser.subjects.length} subjects\n`);

    // Check if new user exists
    let newUser = await prisma.user.findUnique({
      where: { id: newUserId },
    });

    if (!newUser) {
      // Create new user
      console.log("Creating new user with correct Supabase ID...");
      newUser = await prisma.user.create({
        data: {
          id: newUserId,
          email: oldUser.email,
          planType: oldUser.planType,
          notesLimit: oldUser.notesLimit,
          subjectsLimit: oldUser.subjectsLimit,
          aiUsageLimit: oldUser.aiUsageLimit,
          aiUsageCount: oldUser.aiUsageCount,
        },
      });
      console.log("✓ Created new user\n");
    } else {
      console.log("✓ New user already exists\n");
    }

    // Migrate subjects
    if (oldUser.subjects.length > 0) {
      console.log(`Migrating ${oldUser.subjects.length} subjects...`);
      for (const subject of oldUser.subjects) {
        await prisma.subject.update({
          where: { id: subject.id },
          data: { userId: newUserId },
        });
        console.log(`  ✓ Migrated subject: ${subject.title}`);
      }
      console.log("");
    }

    // Delete old user
    console.log("Deleting old user...");
    await prisma.user.delete({
      where: { id: oldUserId },
    });
    console.log("✓ Deleted old user\n");

    console.log("=".repeat(50));
    console.log("✓ Migration complete!\n");
  } catch (error) {
    console.error("✗ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUserData();
