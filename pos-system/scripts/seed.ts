import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing Supabase environment variables. Please check your .env file."
  );
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testUsers = [
  {
    email: "test@example.com",
    password: "password123",
    full_name: "Test Admin",
    role: "ADMIN",
  },
  {
    email: "manager@pos.com",
    password: "password123",
    full_name: "Test Manager",
    role: "MANAGER",
  },
  {
    email: "cashier@pos.com",
    password: "password123",
    full_name: "Test Cashier",
    role: "CASHIER",
  },
];

async function seed() {
  try {
    console.log("Starting database seed...\n");
    let hadErrors = false;

    for (const user of testUsers) {
      try {
        console.log(`\nProcessing user: ${user.email}`);
        // Check if user already exists
        const { data: existingUsers, error: listError } =
          await supabaseAdmin.auth.admin.listUsers();

        if (listError) {
          console.error(`Error listing users for ${user.email}:`, {
            message: listError.message,
            code: listError.code,
            details: listError,
          });
          hadErrors = true;
          continue;
        }

        const userExists = existingUsers?.users?.some(
          (u) => u.email === user.email
        );

        if (userExists) {
          console.log(`User ${user.email} already exists, skipping...`);
          continue;
        }

        // Create auth user
        console.log(`Creating auth user for ${user.email}...`);
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: {
              full_name: user.full_name,
              role: user.role,
            },
          });

        if (authError) {
          console.error(`Error creating user ${user.email}:`, {
            message: authError.message,
            status: authError.status,
            code: authError.code,
            details: authError,
          });
          hadErrors = true;
          continue;
        }

        console.log(
          `Auth user created successfully for ${user.email}`,
          authData.user?.id
        );

        // Create profile with explicit insert (bypasses trigger)
        if (authData.user) {
          // Wait 500ms for trigger to potentially create profile
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Check if profile already exists (from trigger)
          const { data: existingProfile, error: profileCheckError } =
            await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("id", authData.user.id)
              .single();

          if (
            profileCheckError &&
            !profileCheckError.message.includes("No rows found")
          ) {
            console.error(`Error checking profile for ${user.email}:`, {
              message: profileCheckError.message,
              code: profileCheckError.code,
              details: profileCheckError,
            });
          }

          if (!existingProfile) {
            // Profile doesn't exist, create it manually
            console.log(`Creating profile for ${user.email}...`);
            const { error: profileError } = await supabaseAdmin
              .from("profiles")
              .insert({
                id: authData.user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
              });

            if (profileError) {
              console.error(`Error creating profile for ${user.email}:`, {
                message: profileError.message,
                code: profileError.code,
                details: profileError,
              });
              hadErrors = true;
            } else {
              console.log(
                `Created user: ${user.email} (${user.role}) with password: ${user.password}`
              );
            }
          } else {
            console.log(
              `Created user: ${user.email} (${user.role}) with password: ${user.password}`
            );
          }
        }
      } catch (userError: any) {
        console.error(`Error processing user ${user.email}:`, {
          message: userError.message,
          stack: userError.stack,
          details: userError,
        });
        hadErrors = true;
      }
    }

    if (hadErrors) {
      console.error("\nSeed completed with errors.");
      process.exit(1);
    }

    console.log("\nSeed completed successfully!");
  } catch (error: any) {
    console.error("Seed failed:", {
      message: error.message,
      stack: error.stack,
      details: error,
    });
    process.exit(1);
  }
}

seed();
