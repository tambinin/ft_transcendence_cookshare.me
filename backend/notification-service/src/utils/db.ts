import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = `${process.env.NOTIFICATION_DATABASE_URL}`;
const pool = new Pool({ connectionString, connectionTimeoutMillis: 15000 });
pool.on('connect', (client) => {
    client.query('SET search_path TO notification_service');
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

export default db;
