import { config } from 'dotenv';
config({ path: '.env' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set, drizzle will not be initialized');
}
const client = postgres(process.env.DATABASE_URL || '');
export const db = process.env.DATABASE_URL ? drizzle(client) : null;
export function isDrizzleConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
