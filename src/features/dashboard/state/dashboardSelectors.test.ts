/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Regression tests for selector behavior, especially the preserved
 * period bucketing and filtered article pipeline shared across the app.
 */

import { describe, expect, it } from "vitest";
import type { Article, DashboardState } from "@/shared/types";
import {
  groupByPeriod,
  selectAIInsights,
  selectFilteredArticles,
} from "./dashboardSelectors";
import { initialDashboardState } from "./dashboardState";

const articles: Article[] = [
  {
    id: "1",
    title: "US market update",
    source: "Wire",
    url: "https://example.com/1",
    country: "United States",
    countryCode: "US",
    topic: "Business",
    publishedDate: "2023-03-01",
    sentiment: "positive",
    sentimentScore: 0.8,
    entities: ["Federal Reserve", "Wall Street"],
    keywords: ["markets", "stocks"],
    lat: 0,
    lng: 0,
  },
  {
    id: "2",
    title: "Japan technology outlook",
    source: "Journal",
    url: "https://example.com/2",
    country: "Japan",
    countryCode: "JP",
    topic: "Technology",
    publishedDate: "2023-03-07",
    sentiment: "negative",
    sentimentScore: -0.5,
    entities: ["Tokyo", "Chipmakers"],
    keywords: ["technology", "exports"],
    lat: 0,
    lng: 0,
  },
  {
    id: "3",
    title: "US policy briefing",
    source: "Daily",
    url: "https://example.com/3",
    country: "United States",
    countryCode: "US",
    topic: "Politics",
    publishedDate: "2023-03-08",
    sentiment: "neutral",
    sentimentScore: 0,
    entities: ["Federal Reserve", "Congress"],
    keywords: ["policy", "briefing"],
    lat: 0,
    lng: 0,
  },
];

function makeState(
  overrides: Partial<DashboardState> = {},
): DashboardState {
  return {
    ...initialDashboardState,
    ...overrides,
    accessibility: initialDashboardState.accessibility,
  };
}

describe("dashboardSelectors", () => {
  it("groups periods the same way as the exported app", () => {
    expect(groupByPeriod("2023-03-08", "daily")).toBe(
      "2023-03-08",
    );
    expect(groupByPeriod("2023-03-08", "weekly")).toBe(
      "2023-03-06",
    );
    expect(groupByPeriod("2023-03-08", "monthly")).toBe(
      "2023-03-01",
    );
  });

  it("filters by topic, country, search, and selected period", () => {
    const state = makeState({
      selectedTopics: ["Politics"],
      selectedCountries: ["US"],
      searchQuery: "briefing",
      granularity: "weekly",
      selectedPeriod: "2023-03-06",
      dateRange: {
        start: "2023-03-01",
        end: "2023-03-31",
      },
    });

    const filtered = selectFilteredArticles(articles, state);

    expect(filtered.map((article) => article.id)).toEqual(["3"]);
  });

  it("builds AI insights from the filtered articles", () => {
    const state = makeState({
      selectedTopics: ["Business"],
      dateRange: {
        start: "2023-03-01",
        end: "2023-03-31",
      },
    });

    const filtered = selectFilteredArticles(articles, state);
    const insights = selectAIInsights(filtered, state);

    expect(insights.topic).toBe("Business");
    expect(insights.topTopics[0]).toEqual({
      label: "Business",
      count: 1,
    });
    expect(insights.entityFrequency[0]).toEqual({
      entity: "Federal Reserve",
      frequency: 1,
    });
    expect(insights.summaryText).toContain("Analysis of 1 articles");
  });
});
