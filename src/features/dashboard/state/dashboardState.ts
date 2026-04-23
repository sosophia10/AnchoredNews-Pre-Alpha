/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Stores the canonical initial dashboard state and the exported reset
 * ranges that the reducer uses to preserve the original app defaults.
 */

import type { DashboardState } from "@/shared/types";

export const INITIAL_DATE_RANGE = {
  start: "2023-02-24",
  end: "2023-05-11",
} as const;

export const CLEAR_FILTERS_DATE_RANGE = {
  start: "2023-02-26",
  end: "2023-04-30",
} as const;

export const initialDashboardState: DashboardState = {
  activeView: "news",
  activeDrawer: "news",
  aiPanelOpen: false,
  selectedArticle: null,
  articleModalOpen: false,
  searchQuery: "",
  selectedTopics: [],
  dateRange: { ...INITIAL_DATE_RANGE },
  selectedCountries: [],
  hoveredCountry: null,
  granularity: "daily",
  selectedPeriod: null,
  accessibility: {
    fontSize: "default",
    highContrast: false,
    increaseLineHeight: false,
    increaseTargetSize: false,
  },
};
