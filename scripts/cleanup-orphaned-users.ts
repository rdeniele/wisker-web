import { config } from "dotenv";
import { prisma } from "../src/lib/prisma";

// Load environment variables
config();

async function cleanupOrphanedUsers() {
  try {
    console.log(
      "Cleaning up orphaned users (users in Prisma but not in Supabase)...\n",
    );

    const prismaUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            subjects: true,
          },
        },
      },
    });

    // Supabase user IDs (from previous check)
    const validSupabaseIds = [
      "4a9f0ec6-8851-4712-9e3b-de247311ddb6", // rondenielep13@gmail.com
      "2eef347c-6b4a-41e0-a41c-cbcc7990fb8e", // poyhidalgo@gmail.com
    ];

    for (const user of prismaUsers) {
      if (!validSupabaseIds.includes(user.id)) {
        console.log(`Orphaned user found: ${user.email} (${user.id})`);
        console.log(`  - Has ${user._count.subjects} subjects`);

        if (user._count.subjects > 0) {
          console.log(`  ⚠ Skipping deletion - user has data\n`);
        } else {
          console.log(`  ✓ Deleting...`);
          await prisma.user.delete({
            where: { id: user.id },
          });
          console.log(`  ✓ Deleted\n`);
        }
      } else {
        console.log(`Valid user: ${user.email} (${user.id}) ✓\n`);
      }
    }

    console.log("✓ Cleanup complete!\n");
  } catch (error) {
    console.error("✗ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedUsers();
