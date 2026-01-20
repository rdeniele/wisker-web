import { config } from "dotenv";
import { prisma } from "../src/lib/prisma";

// Load environment variables
config();

async function testConnection() {
  try {
    console.log("Testing database connection...");
    
    // Test connection
    await prisma.$connect();
    console.log("✓ Successfully connected to database");
    
    // Try to query users
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        planType: true,
        createdAt: true,
      },
    });
    
    console.log(`✓ Found ${users.length} users in database`);
    if (users.length > 0) {
      console.log("Sample users:");
      users.forEach((user) => {
        console.log(`  - ${user.email} (${user.id}) - ${user.planType}`);
      });
    } else {
      console.log("⚠ No users found in database");
    }
    
    await prisma.$disconnect();
    console.log("✓ Database connection test complete");
  } catch (error) {
    console.error("✗ Database connection error:", error);
    process.exit(1);
  }
}

testConnection();
