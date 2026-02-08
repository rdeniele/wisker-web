import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/prisma";

// Load environment variables
config();

async function syncUsers() {
  try {
    console.log("Syncing users from Supabase to Prisma...\n");

    // Get Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not found");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all Supabase users
    const { data: supabaseUsers, error } =
      await supabase.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    console.log(`Found ${supabaseUsers.users.length} users in Supabase\n`);

    for (const user of supabaseUsers.users) {
      console.log(`Processing: ${user.email} (${user.id})`);

      // Check if user exists in Prisma
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (existingUser) {
        console.log(`  ✓ Already exists in Prisma\n`);
        continue;
      }

      // Create user in Prisma
      try {
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email!,
            planType: "FREE",
            notesLimit: 50,
            subjectsLimit: 10,
            aiUsageLimit: 100,
            aiUsageCount: 0,
          },
        });
        console.log(`  ✓ Created in Prisma database\n`);
      } catch (createError: unknown) {
        const errorMessage = createError instanceof Error ? createError.message : String(createError);
        console.error(`  ✗ Failed to create: ${errorMessage}\n`);
      }
    }

    console.log("=".repeat(50));
    console.log("\n✓ User sync complete!\n");
  } catch (error) {
    console.error("✗ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncUsers();
