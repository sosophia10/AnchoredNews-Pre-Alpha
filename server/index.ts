/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Hosts the PostgreSQL-backed API used by the dashboard so article
 * storage, filtering, and aggregation no longer run against a full browser-side dataset.
 */

import express from "express";
import { serverConfig } from "./config.js";
import {
  getArticlesPage,
  getDashboardBootstrap,
  getDashboardSummary,
  getTrendPoints,
} from "./articles/repository.js";
import {
  parseCursor,
  parseDashboardFilters,
  parseLimit,
  parseTrendDimension,
} from "./articles/filters.js";

const app = express();

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    databaseConfigured: Boolean(serverConfig.databaseUrl),
  });
});

app.get("/api/dashboard/bootstrap", async (_request, response) => {
  try {
    response.json(await getDashboardBootstrap());
  } catch (error) {
    response.status(500).json({
      message:
        error instanceof Error ? error.message : "Bootstrap query failed.",
    });
  }
});

app.get("/api/dashboard/summary", async (request, response) => {
  try {
    response.json(
      await getDashboardSummary(parseDashboardFilters(request)),
    );
  } catch (error) {
    response.status(500).json({
      message:
        error instanceof Error ? error.message : "Summary query failed.",
    });
  }
});

app.get("/api/articles", async (request, response) => {
  try {
    response.json(
      await getArticlesPage(
        parseDashboardFilters(request),
        parseCursor(request),
        parseLimit(request),
      ),
    );
  } catch (error) {
    response.status(500).json({
      message:
        error instanceof Error ? error.message : "Article query failed.",
    });
  }
});

app.get("/api/dashboard/trends", async (request, response) => {
  try {
    response.json(
      await getTrendPoints(
        parseDashboardFilters(request),
        parseTrendDimension(request),
      ),
    );
  } catch (error) {
    response.status(500).json({
      message:
        error instanceof Error ? error.message : "Trend query failed.",
    });
  }
});

app.listen(serverConfig.apiPort, () => {
  console.log(
    `Global News Dashboard API listening on http://localhost:${serverConfig.apiPort}`,
  );
});
