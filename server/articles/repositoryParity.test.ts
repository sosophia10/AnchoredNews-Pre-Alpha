/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Validates that the PostgreSQL-backed article queries preserve the
 * original selector behavior for counts, ordering, and article-driven summaries.
 */

import { afterAll, describe, expect, it } from "vitest";
import { articlesData } from "../../src/data/mockData.js";
import {
  selectAIInsights,
  selectCountryCounts,
  selectFilteredArticles,
} from "../../src/features/dashboard/state/dashboardSelectors.js";
import { initialDashboardState } from "../../src/features/dashboard/state/dashboardState.js";
import { getPool } from "../db/pool.js";
import type { Article } from "../../src/shared/types/index.js";
import {
  getArticlesPage,
  getDashboardSummary,
  getTrendPoints,
} from "./repository.js";

const describeIfDatabase = process.env.DATABASE_URL
  ? describe
  : describe.skip;

const parityScenarios = [
  {
    name: "default filter set",
    filters: {
      searchQuery: "",
      selectedTopics: [],
      selectedCountries: [],
      dateRange: { ...initialDashboardState.dateRange },
      granularity: initialDashboardState.granularity,
      selectedPeriod: null,
    },
  },
  {
    name: "topic + country + search",
    filters: {
      searchQuery: "market",
      selectedTopics: ["Business"],
      selectedCountries: ["US"],
      dateRange: { start: "2023-03-01", end: "2023-04-30" },
      granularity: "weekly" as const,
      selectedPeriod: null,
    },
  },
  {
    name: "selected period filter",
    filters: {
      searchQuery: "",
      selectedTopics: [],
      selectedCountries: [],
      dateRange: { start: "2023-03-01", end: "2023-03-31" },
      granularity: "weekly" as const,
      selectedPeriod: "2023-03-13",
    },
  },
];

describeIfDatabase("repository parity", () => {
  afterAll(async () => {
    await getPool().end();
  });

  for (const scenario of parityScenarios) {
    it(`matches the legacy selector pipeline for ${scenario.name}`, async () => {
      const clientState = {
        ...initialDashboardState,
        ...scenario.filters,
      };
      const clientFiltered = selectFilteredArticles(
        articlesData,
        clientState,
      );
      const clientInsights = selectAIInsights(
        clientFiltered,
        clientState,
      );

      const [summary, page, trends] = await Promise.all([
        getDashboardSummary(scenario.filters),
        getArticlesPage(scenario.filters, null, 10),
        getTrendPoints(scenario.filters, "topics"),
      ]);

      expect(summary.filteredArticleCount).toBe(
        clientFiltered.length,
      );
      expect(summary.countryCounts).toEqual(
        selectCountryCounts(clientFiltered),
      );
      expect(summary.aiInsights.topTopics).toEqual(
        clientInsights.topTopics,
      );
      expect(summary.aiInsights.entityFrequency).toEqual(
        clientInsights.entityFrequency,
      );
      expect(page.items.map((article: Article) => article.id)).toEqual(
        clientFiltered
          .slice(0, 10)
          .map((article: Article) => article.id),
      );
      expect(trends.filteredArticleCount).toBe(clientFiltered.length);
    });
  }
});
