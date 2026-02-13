import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Load environment variables
config({ path: ".env" });

// Create Prisma client
let prisma: PrismaClient | null = null;

async function syncUsers() {
  try {
    console.log("Syncing users from Supabase to Prisma...\n");

    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is not configured. Please set it in your .env file.",
      );
    }

    // Initialize Prisma client
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

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
            notesLimit: 25,
            subjectsLimit: 5,
            dailyCredits: 10,
            creditsUsedToday: 0,
            lastCreditReset: new Date(),
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
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

syncUsers();
