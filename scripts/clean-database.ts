import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Clean Database Script
 * Removes all test data from the database
 * WARNING: This will delete ALL data!
 */
async function cleanDatabase() {
  try {
    console.log("🧹 Cleaning database...\n");

    // Delete in correct order (respecting foreign keys)
    console.log("Deleting learning tool notes...");
    const learningToolNotes = await prisma.learningToolNote.deleteMany();
    console.log(`✓ Deleted ${learningToolNotes.count} learning tool notes`);

    console.log("Deleting learning tools...");
    const learningTools = await prisma.learningTool.deleteMany();
    console.log(`✓ Deleted ${learningTools.count} learning tools`);

    console.log("Deleting notes...");
    const notes = await prisma.note.deleteMany();
    console.log(`✓ Deleted ${notes.count} notes`);

    console.log("Deleting subjects...");
    const subjects = await prisma.subject.deleteMany();
    console.log(`✓ Deleted ${subjects.count} subjects`);

    console.log("Deleting users...");
    const users = await prisma.user.deleteMany();
    console.log(`✓ Deleted ${users.count} users`);

    console.log("\n✅ Database cleaned successfully!");
    console.log("You can now test CRUD operations from scratch.\n");

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Failed to clean database:");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

cleanDatabase();
