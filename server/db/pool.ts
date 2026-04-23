/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Exposes a shared PostgreSQL connection pool for the article query
 * layer so repeated dashboard requests do not create ad hoc connections.
 */

import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { serverConfig } from "../config.js";

let pool: Pool | null = null;

export function getPool() {
  if (!serverConfig.databaseUrl) {
    throw new Error(
      "DATABASE_URL is required to use the PostgreSQL article API.",
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString: serverConfig.databaseUrl,
      max: serverConfig.pgPoolMax,
      ssl: serverConfig.pgSslEnabled
        ? { rejectUnauthorized: false }
        : false,
    });

    // Session-pooled hosted Postgres can reject overly eager parallel clients.
    // A conservative shared pool keeps local dev, tests, and Vercel functions
    // inside the same connection budget while still reusing connections.
    attachDatabasePool(pool);
  }

  return pool;
}
