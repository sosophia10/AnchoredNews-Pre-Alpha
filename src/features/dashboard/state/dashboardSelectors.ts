/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Houses the pure selector layer that derives filtered articles,
 * trend buckets, country counts, and AI insight summaries from dashboard
 * state without mutating the preserved source dataset.
 */

import type {
  AIInsights,
  Article,
  AvailableCountry,
  DashboardState,
  Granularity,
  TrendData,
} from "@/shared/types";

export function groupByPeriod(
  date: string,
  granularity: Granularity,
): string {
  const currentDate = new Date(date);

  if (granularity === "daily") {
    return date;
  }

  if (granularity === "weekly") {
    // Keep the exported implementation's native Date behavior intact so
    // period clicks continue to line up exactly with the existing app.
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(
      currentDate.getDate() - currentDate.getDay(),
    );
    return startOfWeek.toISOString().split("T")[0]!;
  }

  return `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}-01`;
}

export function selectAvailableTopics(
  articles: Article[],
): string[] {
  const topics = new Set<string>();

  for (const article of articles) {
    if (article.topic) {
      topics.add(article.topic);
    }
  }

  return [...topics].sort();
}

export function selectAvailableCountries(
  articles: Article[],
): AvailableCountry[] {
  const countries = new Map<string, string>();

  for (const article of articles) {
    if (article.countryCode && article.country) {
      countries.set(article.countryCode, article.country);
    }
  }

  return [...countries.entries()]
    .map(([code, name]) => ({ code, name }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function selectAllDates(
  articles: Article[],
): string[] {
  const dates = new Set<string>();

  for (const article of articles) {
    dates.add(article.publishedDate);
  }

  return [...dates].sort();
}

export function selectFilteredArticles(
  articles: Article[],
  state: DashboardState,
): Article[] {
  return articles.filter((article) => {
    if (
      state.selectedTopics.length > 0 &&
      !state.selectedTopics.includes(article.topic)
    ) {
      return false;
    }

    if (
      article.publishedDate < state.dateRange.start ||
      article.publishedDate > state.dateRange.end
    ) {
      return false;
    }

    if (
      state.selectedCountries.length > 0 &&
      !state.selectedCountries.includes(article.countryCode)
    ) {
      return false;
    }

    if (state.selectedPeriod) {
      // The selected period acts as an additional derived filter shared by the
      // chart, article list, map, and AI panel.
      const articlePeriod = groupByPeriod(
        article.publishedDate,
        state.granularity,
      );

      if (articlePeriod !== state.selectedPeriod) {
        return false;
      }
    }

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();

      return (
        article.title.toLowerCase().includes(query) ||
        article.source.toLowerCase().includes(query) ||
        article.keywords.some((keyword) =>
          keyword.toLowerCase().includes(query),
        ) ||
        article.entities.some((entity) =>
          entity.toLowerCase().includes(query),
        )
      );
    }

    return true;
  });
}

export function selectCountryCounts(
  filteredArticles: Article[],
): Record<string, number> {
  return filteredArticles.reduce<Record<string, number>>(
    (counts, article) => {
      counts[article.countryCode] =
        (counts[article.countryCode] ?? 0) + 1;
      return counts;
    },
    {},
  );
}

export function selectTrendData(
  filteredArticles: Article[],
  selectedTopics: string[],
): TrendData[] {
  const trendMap: Record<
    string,
    Record<string, { country: string; count: number }>
  > = {};

  for (const article of filteredArticles) {
    if (!trendMap[article.publishedDate]) {
      trendMap[article.publishedDate] = {};
    }

    const dateBucket = trendMap[article.publishedDate]!;

    if (!dateBucket[article.countryCode]) {
      dateBucket[article.countryCode] = {
        country: article.country,
        count: 0,
      };
    }

    dateBucket[article.countryCode]!.count += 1;
  }

  return Object.entries(trendMap)
    .map(([date, countries]) => ({
      date,
      topic:
        selectedTopics.length > 0
          ? selectedTopics.join(", ")
          : "All topics",
      series: Object.entries(countries).map(
        ([countryCode, value]) => ({
          countryCode,
          country: value.country,
          articleCount: value.count,
        }),
      ),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function selectAIInsights(
  filteredArticles: Article[],
  state: DashboardState,
): AIInsights {
  const topicCounts: Record<string, number> = {};
  const entityCounts: Record<string, number> = {};

  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;

  for (const article of filteredArticles) {
    topicCounts[article.topic] =
      (topicCounts[article.topic] ?? 0) + 1;

    for (const entity of article.entities) {
      entityCounts[entity] = (entityCounts[entity] ?? 0) + 1;
    }

    if (article.sentiment === "positive") {
      positiveCount += 1;
    } else if (article.sentiment === "negative") {
      negativeCount += 1;
    } else {
      neutralCount += 1;
    }
  }

  const topTopics = Object.entries(topicCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  const entityFrequency = Object.entries(entityCounts)
    .map(([entity, frequency]) => ({ entity, frequency }))
    .sort((left, right) => right.frequency - left.frequency)
    .slice(0, 8);

  const dominantSentiment =
    positiveCount > neutralCount && positiveCount > negativeCount
      ? "positive"
      : negativeCount > neutralCount &&
          negativeCount > positiveCount
        ? "negative"
        : "neutral";

  const topEntity = entityFrequency[0]?.entity ?? "various entities";
  const topEntityCount = entityFrequency[0]?.frequency ?? 0;

  return {
    topic:
      state.selectedTopics.length > 0
        ? state.selectedTopics.join(", ")
        : "All topics",
    dateRange: state.dateRange,
    topTopics,
    entityFrequency,
    sentimentSummary: {
      positiveCount,
      neutralCount,
      negativeCount,
    },
    summaryText: `Analysis of ${filteredArticles.length} articles ${
      state.selectedTopics.length > 0
        ? `on ${state.selectedTopics.join(", ")}`
        : "across topics"
    } from ${state.dateRange.start} to ${state.dateRange.end}. ${topEntity} is the most mentioned entity with ${topEntityCount} occurrences. Overall sentiment is ${dominantSentiment} with ${positiveCount} positive, ${neutralCount} neutral, and ${negativeCount} negative articles.`,
  };
}
