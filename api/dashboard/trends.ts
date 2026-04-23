/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Exposes trend aggregates as a Vercel Function so the deployed
 * trends view can keep using server-side PostgreSQL bucketing and filtering.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTrendPoints } from "../../server/articles/repository.js";
import {
  parseDashboardFiltersFromQuery,
  parseTrendDimensionFromQuery,
} from "../../server/articles/filters.js";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    response.status(200).json(
      await getTrendPoints(
        parseDashboardFiltersFromQuery(request.query),
        parseTrendDimensionFromQuery(request.query),
      ),
    );
  } catch (error) {
    response.status(500).json({
      message:
        error instanceof Error ? error.message : "Trend query failed.",
    });
  }
}
