/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Parses dashboard filters from API requests and builds safe SQL
 * clauses for article, summary, and trend queries.
 */

import type {
  DateRange,
  Granularity,
  TrendDimension,
} from "../../src/shared/types/index.js";

export interface DashboardFilters {
  searchQuery: string;
  selectedTopics: string[];
  selectedCountries: string[];
  dateRange: DateRange;
  granularity: Granularity;
  selectedPeriod: string | null;
}

export interface ArticleCursor {
  sortOrder: number;
  id: string;
}

export type QueryInput = Record<string, unknown>;

function getListValue(value: unknown) {
  const normalized = Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === "string")
        .join(",")
    : typeof value === "string"
      ? value
      : "";

  return normalized
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseDashboardFiltersFromQuery(
  query: QueryInput,
): DashboardFilters {
  const granularity =
    query.granularity === "weekly" ||
    query.granularity === "monthly"
      ? query.granularity
      : "daily";

  return {
    searchQuery:
      typeof query.search === "string"
        ? query.search.trim()
        : "",
    selectedTopics: getListValue(query.topics),
    selectedCountries: getListValue(query.countries),
    dateRange: {
      start:
        typeof query.startDate === "string"
          ? query.startDate
          : "2023-02-24",
      end:
        typeof query.endDate === "string"
          ? query.endDate
          : "2023-05-11",
    },
    granularity,
    selectedPeriod:
      typeof query.selectedPeriod === "string" &&
      query.selectedPeriod.length > 0
        ? query.selectedPeriod
        : null,
  };
}

export function parseTrendDimensionFromQuery(
  query: QueryInput,
): TrendDimension {
  const dimension = query.dimension;

  if (
    dimension === "sentiment" ||
    dimension === "entities" ||
    dimension === "countries"
  ) {
    return dimension;
  }

  return "topics";
}

export function parseLimitFromQuery(
  query: QueryInput,
  fallback = 40,
) {
  const rawLimit =
    typeof query.limit === "string"
      ? Number(query.limit)
      : fallback;

  if (Number.isNaN(rawLimit)) {
    return fallback;
  }

  return Math.max(1, Math.min(100, rawLimit));
}

export function parseCursorFromQuery(
  query: QueryInput,
): ArticleCursor | null {
  const rawCursor =
    typeof query.cursor === "string"
      ? query.cursor
      : "";

  if (!rawCursor) {
    return null;
  }

  const [sortOrder, id] = rawCursor.split("|");

  if (!sortOrder || !id) {
    return null;
  }

  const numericSortOrder = Number(sortOrder);

  if (Number.isNaN(numericSortOrder)) {
    return null;
  }

  return { sortOrder: numericSortOrder, id };
}

export function parseDashboardFilters(request: {
  query: QueryInput;
}): DashboardFilters {
  return parseDashboardFiltersFromQuery(request.query);
}

export function parseTrendDimension(request: {
  query: QueryInput;
}): TrendDimension {
  return parseTrendDimensionFromQuery(request.query);
}

export function parseLimit(
  request: { query: QueryInput },
  fallback = 40,
) {
  return parseLimitFromQuery(request.query, fallback);
}

export function parseCursor(request: {
  query: QueryInput;
}): ArticleCursor | null {
  return parseCursorFromQuery(request.query);
}

export function encodeCursor(article: ArticleCursor) {
  return `${article.sortOrder}|${article.id}`;
}

export function getPeriodExpression(granularity: Granularity) {
  if (granularity === "weekly") {
    return "to_char(date_trunc('week', published_date::timestamp)::date, 'YYYY-MM-DD')";
  }

  if (granularity === "monthly") {
    return "to_char(date_trunc('month', published_date::timestamp)::date, 'YYYY-MM-DD')";
  }

  return "to_char(published_date, 'YYYY-MM-DD')";
}

export function buildFilterQuery(filters: DashboardFilters) {
  const values: Array<string | string[]> = [];
  const conditions = [
    `published_date BETWEEN $${values.push(filters.dateRange.start)}::date AND $${values.push(filters.dateRange.end)}::date`,
  ];

  if (filters.selectedTopics.length > 0) {
    conditions.push(
      `topic = ANY($${values.push(filters.selectedTopics)}::text[])`,
    );
  }

  if (filters.selectedCountries.length > 0) {
    conditions.push(
      `country_code = ANY($${values.push(filters.selectedCountries)}::text[])`,
    );
  }

  if (filters.selectedPeriod) {
    conditions.push(
      `${getPeriodExpression(filters.granularity)} = $${values.push(filters.selectedPeriod)}`,
    );
  }

  if (filters.searchQuery) {
    conditions.push(
      `search_text ILIKE $${values.push(`%${filters.searchQuery}%`)}`,
    );
  }

  return {
    values,
    whereClause: `WHERE ${conditions.join(" AND ")}`,
  };
}
