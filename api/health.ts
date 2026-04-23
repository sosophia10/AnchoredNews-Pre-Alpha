/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Exposes the health endpoint as a Vercel Function so the deployed
 * dashboard can report API/database readiness without the local Express server.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { serverConfig } from "../server/config.js";

export default function handler(
  _request: VercelRequest,
  response: VercelResponse,
) {
  response.status(200).json({
    ok: true,
    databaseConfigured: Boolean(serverConfig.databaseUrl),
  });
}
