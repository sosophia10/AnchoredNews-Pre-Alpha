/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Serves paginated article data from PostgreSQL through a Vercel
 * Function while preserving the local API contract used by the React app.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getArticlesPage } from "../server/articles/repository.js";
import {
  parseCursorFromQuery,
  parseDashboardFiltersFromQuery,
  parseLimitFromQuery,
} from "../server/articles/filters.js";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    response.status(200).json(
      await getArticlesPage(
        parseDashboardFiltersFromQuery(request.query),
        parseCursorFromQuery(request.query),
        parseLimitFromQuery(request.query),
      ),
    );
  } catch (error) {
    response.status(500).json({
      message:
        error instanceof Error ? error.message : "Article query failed.",
    });
  }
}
