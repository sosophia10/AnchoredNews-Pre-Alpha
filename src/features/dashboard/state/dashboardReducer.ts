/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Defines the dashboard reducer and actions that coordinate the
 * preserved UI interactions across views, drawers, filters, and accessibility.
 */

import type {
  Article,
  DashboardDrawer,
  DashboardState,
  DashboardView,
  DateRange,
  FontSize,
  Granularity,
} from "@/shared/types";
import { CLEAR_FILTERS_DATE_RANGE } from "./dashboardState";

type DashboardAction =
  | { type: "set-view"; view: DashboardView }
  | { type: "set-drawer"; drawer: DashboardDrawer }
  | { type: "set-ai-panel-open"; isOpen: boolean }
  | { type: "set-search-query"; query: string }
  | { type: "toggle-topic"; topic: string }
  | { type: "set-date-range"; range: DateRange }
  | { type: "toggle-country"; countryCode: string }
  | { type: "set-hovered-country"; countryCode: string | null }
  | { type: "clear-countries" }
  | { type: "clear-filters" }
  | { type: "set-granularity"; granularity: Granularity }
  | { type: "set-selected-period"; period: string | null }
  | { type: "open-article"; article: Article }
  | { type: "close-article" }
  | { type: "set-font-size"; fontSize: FontSize }
  | { type: "toggle-high-contrast" }
  | { type: "toggle-line-height" }
  | { type: "toggle-target-size" };

export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction,
): DashboardState {
  switch (action.type) {
    case "set-view":
      return {
        ...state,
        activeView: action.view,
      };
    case "set-drawer":
      return {
        ...state,
        activeDrawer: action.drawer,
      };
    case "set-ai-panel-open":
      return {
        ...state,
        aiPanelOpen: action.isOpen,
      };
    case "set-search-query":
      return {
        ...state,
        searchQuery: action.query,
      };
    case "toggle-topic":
      return {
        ...state,
        selectedTopics: state.selectedTopics.includes(action.topic)
          ? state.selectedTopics.filter(
              (topic) => topic !== action.topic,
            )
          : [...state.selectedTopics, action.topic],
      };
    case "set-date-range":
      return {
        ...state,
        dateRange: action.range,
      };
    case "toggle-country":
      return {
        ...state,
        selectedCountries: state.selectedCountries.includes(
          action.countryCode,
        )
          ? state.selectedCountries.filter(
              (countryCode) => countryCode !== action.countryCode,
            )
          : [...state.selectedCountries, action.countryCode],
      };
    case "set-hovered-country":
      return {
        ...state,
        hoveredCountry: action.countryCode,
      };
    case "clear-countries":
      return {
        ...state,
        selectedCountries: [],
      };
    case "clear-filters":
      return {
        ...state,
        selectedTopics: [],
        dateRange: { ...CLEAR_FILTERS_DATE_RANGE },
        selectedCountries: [],
        searchQuery: "",
        selectedPeriod: null,
      };
    case "set-granularity":
      return {
        ...state,
        granularity: action.granularity,
      };
    case "set-selected-period":
      return {
        ...state,
        selectedPeriod: action.period,
      };
    case "open-article":
      return {
        ...state,
        selectedArticle: action.article,
        articleModalOpen: true,
      };
    case "close-article":
      return {
        ...state,
        selectedArticle: null,
        articleModalOpen: false,
      };
    case "set-font-size":
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          fontSize: action.fontSize,
        },
      };
    case "toggle-high-contrast":
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          highContrast: !state.accessibility.highContrast,
        },
      };
    case "toggle-line-height":
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          increaseLineHeight:
            !state.accessibility.increaseLineHeight,
        },
      };
    case "toggle-target-size":
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          increaseTargetSize:
            !state.accessibility.increaseTargetSize,
        },
      };
    default:
      return state;
  }
}

export type { DashboardAction };
