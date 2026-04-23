/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Exposes dashboard bootstrap metadata as a Vercel Function so the
 * deployed frontend can load topic, country, and date bounds from PostgreSQL.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDashboardBootstrap } from "../../server/articles/repository.js";

export default async function handler(
  _request: VercelRequest,
  response: VercelResponse,
) {
  try {
    response.status(200).json(await getDashboardBootstrap());
  } catch (error) {
    response.status(500).json({
      message:
        error instanceof Error ? error.message : "Bootstrap query failed.",
    });
  }
}
