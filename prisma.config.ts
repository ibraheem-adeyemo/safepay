import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Load .env before Prisma reads environment variables
config();

export default defineConfig({
  datasource: {
    // Use the direct (non-pooled) URL for CLI operations (db push, migrate, studio)
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
