/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Defines the dashboard view, drawer, filter, accessibility, and AI
 * insight types used by the state layer and feature components.
 */

import type { Article } from "./article.js";

export type DashboardView = "news" | "trends";
export type DashboardDrawer = "news" | "filter" | "adjust" | null;
export type FontSize = "small" | "default" | "large" | "xl";
export type Granularity = "daily" | "weekly" | "monthly";
export type TrendDimension =
  | "topics"
  | "sentiment"
  | "entities"
  | "countries";

export interface DateRange {
  start: string;
  end: string;
}

export interface DateBounds {
  start: string;
  end: string;
}

export interface AvailableCountry {
  code: string;
  name: string;
}

export interface AccessibilitySettings {
  fontSize: FontSize;
  highContrast: boolean;
  increaseLineHeight: boolean;
  increaseTargetSize: boolean;
}

export interface DashboardState {
  activeView: DashboardView;
  activeDrawer: DashboardDrawer;
  aiPanelOpen: boolean;
  selectedArticle: Article | null;
  articleModalOpen: boolean;
  searchQuery: string;
  selectedTopics: string[];
  dateRange: DateRange;
  selectedCountries: string[];
  hoveredCountry: string | null;
  granularity: Granularity;
  selectedPeriod: string | null;
  accessibility: AccessibilitySettings;
}

export interface AIInsights {
  topic: string;
  dateRange: DateRange;
  topTopics: Array<{
    label: string;
    count: number;
  }>;
  entityFrequency: Array<{
    entity: string;
    frequency: number;
  }>;
  sentimentSummary: {
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
  };
  summaryText: string;
}

export interface DashboardBootstrap {
  availableTopics: string[];
  availableCountries: AvailableCountry[];
  dateBounds: DateBounds;
  totalArticleCount: number;
}

export interface DashboardSummary {
  filteredArticleCount: number;
  countryCounts: Record<string, number>;
  aiInsights: AIInsights;
}

export interface ArticlePage {
  items: Article[];
  nextCursor: string | null;
}

export interface TrendPoint {
  period: string;
  totalArticles: number;
  dominantTopic: string;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  values: Array<{
    key: string;
    count: number;
  }>;
}

export interface TrendResponse {
  filteredArticleCount: number;
  points: TrendPoint[];
}
