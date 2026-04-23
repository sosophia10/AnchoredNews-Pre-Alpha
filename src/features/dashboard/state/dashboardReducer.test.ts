/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Regression tests for reducer behaviors that future engineers are
 * most likely to touch while maintaining parity with the exported dashboard.
 */

import { describe, expect, it } from "vitest";
import { dashboardReducer } from "./dashboardReducer";
import {
  CLEAR_FILTERS_DATE_RANGE,
  initialDashboardState,
} from "./dashboardState";

describe("dashboardReducer", () => {
  it("toggles countries in place", () => {
    const withCountry = dashboardReducer(initialDashboardState, {
      type: "toggle-country",
      countryCode: "US",
    });

    expect(withCountry.selectedCountries).toEqual(["US"]);

    const withoutCountry = dashboardReducer(withCountry, {
      type: "toggle-country",
      countryCode: "US",
    });

    expect(withoutCountry.selectedCountries).toEqual([]);
  });

  it("clears filters back to the exported reset state", () => {
    const dirtyState = {
      ...initialDashboardState,
      searchQuery: "markets",
      selectedTopics: ["Business"],
      selectedCountries: ["US", "JP"],
      selectedPeriod: "2023-03-05",
    };

    const nextState = dashboardReducer(dirtyState, {
      type: "clear-filters",
    });

    expect(nextState.searchQuery).toBe("");
    expect(nextState.selectedTopics).toEqual([]);
    expect(nextState.selectedCountries).toEqual([]);
    expect(nextState.selectedPeriod).toBeNull();
    expect(nextState.dateRange).toEqual(CLEAR_FILTERS_DATE_RANGE);
  });

  it("opens and closes the article modal", () => {
    const article = {
      id: "1",
      title: "Article",
      source: "Source",
      url: "https://example.com",
      country: "United States",
      countryCode: "US",
      topic: "Politics",
      publishedDate: "2023-03-01",
      sentiment: "neutral" as const,
      sentimentScore: 0,
      entities: ["Entity"],
      keywords: ["Keyword"],
      lat: 0,
      lng: 0,
    };

    const openState = dashboardReducer(initialDashboardState, {
      type: "open-article",
      article,
    });

    expect(openState.articleModalOpen).toBe(true);
    expect(openState.selectedArticle).toEqual(article);

    const closedState = dashboardReducer(openState, {
      type: "close-article",
    });

    expect(closedState.articleModalOpen).toBe(false);
    expect(closedState.selectedArticle).toBeNull();
  });
});
