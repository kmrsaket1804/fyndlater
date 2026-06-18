import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';
import { getPostgresUrl } from './connection';

dotenv.config();

type Database = ReturnType<typeof drizzle<typeof schema>>;
type Client = ReturnType<typeof postgres>;

let client: Client | undefined;
let database: Database | undefined;

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
