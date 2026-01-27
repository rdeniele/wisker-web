/**
 * Mark First 50 Users as Early Users
 * Automatically assigns early user status to the first 50 registered users
 *
 * Usage: npx tsx scripts/mark-early-users.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function markEarlyUsers() {
  console.log("🎯 Marking First 50 Users as Early Users\n");

  try {
    // Get the first 50 users by creation date
    const first50Users = await prisma.user.findMany({
      take: 50,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        createdAt: true,
        isEarlyUser: true,
      },
    });

    console.log(`Found ${first50Users.length} users to process\n`);

    if (first50Users.length === 0) {
      console.log("⚠️  No users found in the database");
      return;
    }

    let updatedCount = 0;
    let alreadyMarkedCount = 0;

    // Update each user
    for (let i = 0; i < first50Users.length; i++) {
      const user = first50Users[i];
      const earlyUserNumber = i + 1;

      if (user.isEarlyUser) {
        console.log(
          `  ⏭️  ${user.email} - Already marked as early user #${earlyUserNumber}`,
        );
        alreadyMarkedCount++;
        continue;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEarlyUser: true,
          earlyUserNumber,
        },
      });

      console.log(
        `  ✅ ${user.email} - Marked as early user #${earlyUserNumber}`,
      );
      updatedCount++;
    }

    console.log("\n📊 Summary:");
    console.log(`  Total users processed: ${first50Users.length}`);
    console.log(`  Newly marked: ${updatedCount}`);
    console.log(`  Already marked: ${alreadyMarkedCount}`);
    console.log("\n✅ Done! Early users now get 50% discount automatically.\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

markEarlyUsers();
