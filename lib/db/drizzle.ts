import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

type Database = ReturnType<typeof drizzle<typeof schema>>;
type Client = ReturnType<typeof postgres>;

let client: Client | undefined;
let database: Database | undefined;

function getPostgresUrl() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }
  // Neon pooler works best without channel_binding for postgres.js
  return url
    .replace('?channel_binding=require&', '?')
    .replace('&channel_binding=require', '')
    .replace('?channel_binding=require', '');
}

function getClient() {
  if (!client) {
    client = postgres(getPostgresUrl(), {
      prepare: false,
      max: 10,
    });
  }
  return client;
}

function getDatabase() {
  if (!database) {
    database = drizzle(getClient(), { schema });
  }
  return database;
}

export const db = new Proxy({} as Database, {
  get(_target, property) {
    return Reflect.get(getDatabase(), property);
  },
});

export { getClient as client };
