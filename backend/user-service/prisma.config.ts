import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.USER_DATABASE_URL,
  },
});
