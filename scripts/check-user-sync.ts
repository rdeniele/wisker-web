import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/prisma";

// Load environment variables
config();

async function checkUserSync() {
  try {
    console.log("Checking user sync between Supabase and Prisma...\n");
    
    // Get Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not found");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all Supabase users
    const { data: supabaseUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${supabaseUsers.users.length} users in Supabase:`);
    for (const user of supabaseUsers.users) {
      console.log(`  - ${user.email} (${user.id})`);
      
      // Check if user exists in Prisma
      const prismaUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      
      if (prismaUser) {
        console.log(`    ✓ Exists in Prisma database`);
      } else {
        console.log(`    ✗ NOT in Prisma database - needs sync!`);
      }
    }
    
    console.log("\n" + "=".repeat(50));
    
    // Get all Prisma users
    const prismaUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
      },
    });
    
    console.log(`\nFound ${prismaUsers.length} users in Prisma database:`);
    for (const user of prismaUsers) {
      console.log(`  - ${user.email} (${user.id})`);
    }
    
  } catch (error) {
    console.error("✗ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSync();
