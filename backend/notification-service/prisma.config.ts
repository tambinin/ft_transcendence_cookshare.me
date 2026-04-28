import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

export default defineConfig({
    datasource: {
        url: process.env.NOTIFICATION_DATABASE_URL,
    },
});
