import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';
dotenv.config();
const poolConnection = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_appointments_db',
});
export const db = drizzle(poolConnection, { schema, mode: 'default' });
export { schema };
