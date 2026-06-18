function sanitizePostgresUrl(url: string) {
  return url
    .replace('?channel_binding=require&', '?')
    .replace('&channel_binding=require', '')
    .replace('?channel_binding=require', '');
}

export function getPostgresUrl() {
  const directUrl =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (directUrl) {
    return sanitizePostgresUrl(directUrl);
  }

  const host = process.env.POSTGRES_HOST || process.env.PGHOST;
  const user = process.env.POSTGRES_USER || process.env.PGUSER;
  const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  const database =
    process.env.POSTGRES_DATABASE || process.env.PGDATABASE || 'neondb';

  if (host && user && password) {
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    return `postgresql://${encodedUser}:${encodedPassword}@${host}/${database}?sslmode=require`;
  }

  throw new Error(
    'Database URL is not configured. Set POSTGRES_URL or DATABASE_URL in Vercel (Neon → Connect → copy pooled connection string).'
  );
}
