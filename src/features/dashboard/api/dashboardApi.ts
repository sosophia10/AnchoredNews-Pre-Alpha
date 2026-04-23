/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Wraps the dashboard API calls so the client can request paginated
 * articles and server-side aggregates without touching the full dataset in-browser.
 */

import type {
  ArticlePage,
  DashboardBootstrap,
  DashboardSummary,
  DateRange,
  Granularity,
  TrendDimension,
  TrendResponse,
} from "@/shared/types";

export interface DashboardQueryFilters {
  searchQuery: string;
  selectedTopics: string[];
  selectedCountries: string[];
  dateRange: DateRange;
  granularity: Granularity;
  selectedPeriod: string | null;
}

function buildQueryParams(filters: DashboardQueryFilters) {
  const params = new URLSearchParams({
    startDate: filters.dateRange.start,
    endDate: filters.dateRange.end,
    granularity: filters.granularity,
  });

  if (filters.searchQuery) {
    params.set("search", filters.searchQuery);
  }

  if (filters.selectedTopics.length > 0) {
    params.set("topics", filters.selectedTopics.join(","));
  }

  if (filters.selectedCountries.length > 0) {
    params.set("countries", filters.selectedCountries.join(","));
  }

  if (filters.selectedPeriod) {
    params.set("selectedPeriod", filters.selectedPeriod);
  }

  return params;
}

async function fetchJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, { signal });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(
      data?.message ?? `Request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as T;
}

export function fetchDashboardBootstrap(signal?: AbortSignal) {
  return fetchJson<DashboardBootstrap>(
    "/api/dashboard/bootstrap",
    signal,
  );
}

export function fetchDashboardSummary(
  filters: DashboardQueryFilters,
  signal?: AbortSignal,
) {
  return fetchJson<DashboardSummary>(
    `/api/dashboard/summary?${buildQueryParams(filters).toString()}`,
    signal,
  );
}

export function fetchArticlePage(
  filters: DashboardQueryFilters,
  cursor: string | null,
  limit: number,
  signal?: AbortSignal,
) {
  const params = buildQueryParams(filters);
  params.set("limit", String(limit));

  if (cursor) {
    params.set("cursor", cursor);
  }

  return fetchJson<ArticlePage>(
    `/api/articles?${params.toString()}`,
    signal,
  );
}

export function fetchTrendResponse(
  filters: DashboardQueryFilters,
  dimension: TrendDimension,
  signal?: AbortSignal,
) {
  const params = buildQueryParams(filters);
  params.set("dimension", dimension);

  return fetchJson<TrendResponse>(
    `/api/dashboard/trends?${params.toString()}`,
    signal,
  );
}
