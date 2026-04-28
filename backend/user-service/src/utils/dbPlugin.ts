import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const dbUrl = new URL(process.env.USER_DATABASE_URL!);
const schema = dbUrl.searchParams.get('schema');
const pool = new Pool({ connectionString: process.env.USER_DATABASE_URL });
const adapter = new PrismaPg(pool, { schema });

const db = new PrismaClient({ adapter });

export default db;
