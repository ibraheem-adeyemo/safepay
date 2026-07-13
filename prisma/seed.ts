import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { hash } from "bcryptjs";
import { config } from "dotenv";
import ws from "ws";

// Load .env and configure WebSocket for Node.js
config();
neonConfig.webSocketConstructor = ws;

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set.");
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

const db = createClient();

async function main() {
  console.log("🌱 Seeding database…");

  // Global fee configuration (1.5% by default) — null businessId = platform default
  const globalFee = await db.feeConfig.findFirst({ where: { businessId: null } });
  if (!globalFee) {
    await db.feeConfig.create({
      data: { feeType: "PERCENTAGE", feeValue: 1.5, isFree: false },
    });
    console.log("✅ Global fee config created: 1.5%");
  }

  // Super admin account
  const adminEmail = "admin@vaultlify.com";
  const adminPassword = "REMOVED_FROM_HISTORY";

  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await hash(adminPassword, 12);
    await db.user.create({
      data: {
        name: "Vaultlify Admin",
        email: adminEmail,
        passwordHash,
        accountType: "SUPER_ADMIN",
        emailVerified: true,
        isClaimed: true,
        channel: "WEB",
      },
    });
    console.log(`✅ Super admin created: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log("   ⚠️  Change this password immediately after first login.");
  } else {
    console.log(`ℹ️  Super admin already exists: ${adminEmail}`);
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
