/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Exposes article summary aggregates as a Vercel Function so deployed
 * filters, map counts, and AI insights stay PostgreSQL-backed.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDashboardSummary } from "../../server/articles/repository.js";
import { parseDashboardFiltersFromQuery } from "../../server/articles/filters.js";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    response.status(200).json(
      await getDashboardSummary(
        parseDashboardFiltersFromQuery(request.query),
      ),
    );
  } catch (error) {
    response.status(500).json({
      message:
        error instanceof Error ? error.message : "Summary query failed.",
    });
  }
}
