import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: ReturnType<typeof drizzle>;
};

function getPool() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Set it in your environment before using database-backed features.");
  }

  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString: databaseUrl,
    });
  }

  return globalForDb.__arenaNextJsPostgresqlPool;
}

function getDb() {
  if (!globalForDb.__arenaNextJsPostgresqlDb) {
    globalForDb.__arenaNextJsPostgresqlDb = drizzle(getPool());
  }

  return globalForDb.__arenaNextJsPostgresqlDb;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const resolved = getPool();
    const value = Reflect.get(resolved as unknown as object, prop, receiver);
    return typeof value === "function" ? value.bind(resolved) : value;
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    const resolved = getDb();
    const value = Reflect.get(resolved as unknown as object, prop, receiver);
    return typeof value === "function" ? value.bind(resolved) : value;
  },
});
