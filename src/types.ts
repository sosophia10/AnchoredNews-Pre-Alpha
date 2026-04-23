/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Preserves a compatibility re-export so migrated files can resolve
 * shared types from a single legacy import path during the rebuild.
 */

export type {
  AIInsights,
  Article,
  ArticlePage,
  AvailableCountry,
  CountryCentroid,
  DashboardBootstrap,
  DashboardSummary,
  DateBounds,
  DateRange,
  TrendDimension,
  TrendPoint,
  TrendResponse,
  TrendData,
} from "./shared/types/index.js";
