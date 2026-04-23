/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Centralizes server configuration for the PostgreSQL-backed article
 * API used by the dashboard.
 */

import dotenv from "dotenv";

dotenv.config();

export const serverConfig = {
  apiPort: Number(process.env.API_PORT ?? "3001"),
  databaseUrl: process.env.DATABASE_URL ?? "",
  pgSslEnabled: process.env.PGSSL !== "false",
  pgPoolMax: Number(process.env.PGPOOLMAX ?? "1"),
} as const;
