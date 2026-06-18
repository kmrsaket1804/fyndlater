import type { Config } from 'drizzle-kit';
import { getPostgresUrl } from './lib/db/connection';

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getPostgresUrl(),
  },
} satisfies Config;
