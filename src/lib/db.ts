import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL!;

/** Pooled connection for all regular queries */
export const sql = postgres(DATABASE_URL, {
  ssl: 'require',
});

/** Single persistent connection for LISTEN/NOTIFY only */
export const listenSql = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 1,
  idle_timeout: 0,
  max_lifetime: 0,
});
