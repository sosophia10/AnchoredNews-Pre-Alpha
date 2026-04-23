/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Executes PostgreSQL queries for article pagination, summary
 * aggregates, bootstrap metadata, and trend data.
 */

import type {
  AIInsights,
  Article,
  AvailableCountry,
  DashboardBootstrap,
  DashboardSummary,
  TrendDimension,
  TrendPoint,
} from "../../src/shared/types/index.js";
import { getPool } from "../db/pool.js";
import {
  buildFilterQuery,
  type DashboardFilters,
  encodeCursor,
  getPeriodExpression,
  type ArticleCursor,
} from "./filters.js";

interface QueryArticleRow {
  id: string;
  sort_order: number;
  title: string;
  source: string;
  url: string;
  country: string;
  country_code: string;
  topic: string;
  published_date: string;
  sentiment: Article["sentiment"];
  sentiment_score: number;
  entities: string[];
  keywords: string[];
  lat: number;
  lng: number;
}

function mapArticle(row: QueryArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    url: row.url,
    country: row.country,
    countryCode: row.country_code,
    topic: row.topic,
    publishedDate: row.published_date,
    sentiment: row.sentiment,
    sentimentScore: row.sentiment_score,
    entities: row.entities,
    keywords: row.keywords,
    lat: row.lat,
    lng: row.lng,
  };
}

export async function getDashboardBootstrap(): Promise<DashboardBootstrap> {
  const pool = getPool();

  const [topicsResult, countriesResult, boundsResult, totalResult] =
    await Promise.all([
      pool.query<{ topic: string }>(
        `SELECT DISTINCT topic
         FROM public.articles
         ORDER BY topic ASC`,
      ),
      pool.query<{ code: string; name: string }>(
        `SELECT DISTINCT country_code AS code, country AS name
         FROM public.articles
         ORDER BY name ASC`,
      ),
      pool.query<{ start: string; end: string }>(
        `SELECT
           MIN(published_date)::text AS start,
           MAX(published_date)::text AS "end"
         FROM public.articles`,
      ),
      pool.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM public.articles",
      ),
    ]);

  return {
    availableTopics: topicsResult.rows.map((row) => row.topic),
    availableCountries:
      countriesResult.rows as AvailableCountry[],
    dateBounds: {
      start: boundsResult.rows[0]?.start ?? "2023-02-24",
      end: boundsResult.rows[0]?.end ?? "2023-05-11",
    },
    totalArticleCount: Number(totalResult.rows[0]?.count ?? "0"),
  };
}

export async function getDashboardSummary(
  filters: DashboardFilters,
): Promise<DashboardSummary> {
  const pool = getPool();
  const { values, whereClause } = buildFilterQuery(filters);

  const [countResult, countryResult, topicResult, entityResult, sentimentResult] =
    await Promise.all([
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM public.articles
         ${whereClause}`,
        values,
      ),
      pool.query<{ countryCode: string; count: string }>(
        `SELECT
           country_code AS "countryCode",
           COUNT(*)::text AS count
         FROM public.articles
         ${whereClause}
         GROUP BY country_code
         ORDER BY MIN(sort_order) ASC, country_code ASC`,
        values,
      ),
      pool.query<{ label: string; count: string }>(
        `SELECT
           topic AS label,
           COUNT(*)::text AS count
         FROM public.articles
         ${whereClause}
         GROUP BY topic
         ORDER BY COUNT(*) DESC, MIN(sort_order) ASC, label ASC
         LIMIT 5`,
        values,
      ),
      pool.query<{ entity: string; frequency: string }>(
        `SELECT
           counts.entity,
           counts.frequency::text AS frequency
         FROM (
           SELECT
             entity_rows.entity,
             COUNT(*)::int AS frequency
           FROM public.articles
           CROSS JOIN LATERAL unnest(entities) WITH ORDINALITY AS entity_rows(entity, entity_position)
           ${whereClause}
           GROUP BY entity_rows.entity
         ) AS counts
         INNER JOIN (
           SELECT DISTINCT ON (entity_rows.entity)
             entity_rows.entity,
             public.articles.sort_order,
             entity_rows.entity_position
           FROM public.articles
           CROSS JOIN LATERAL unnest(entities) WITH ORDINALITY AS entity_rows(entity, entity_position)
           ${whereClause}
           ORDER BY entity_rows.entity, public.articles.sort_order ASC, entity_rows.entity_position ASC
         ) AS first_occurrence
           ON first_occurrence.entity = counts.entity
         ORDER BY counts.frequency DESC, first_occurrence.sort_order ASC, first_occurrence.entity_position ASC, counts.entity ASC
         LIMIT 8`,
        values,
      ),
      pool.query<{ sentiment: Article["sentiment"]; count: string }>(
        `SELECT
           sentiment,
           COUNT(*)::text AS count
         FROM public.articles
         ${whereClause}
         GROUP BY sentiment`,
        values,
      ),
    ]);

  const filteredArticleCount = Number(
    countResult.rows[0]?.count ?? "0",
  );

  const sentimentSummary = {
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
  };

  for (const row of sentimentResult.rows) {
    if (row.sentiment === "positive") {
      sentimentSummary.positiveCount = Number(row.count);
    } else if (row.sentiment === "negative") {
      sentimentSummary.negativeCount = Number(row.count);
    } else {
      sentimentSummary.neutralCount = Number(row.count);
    }
  }

  const topTopics = topicResult.rows.map((row) => ({
    label: row.label,
    count: Number(row.count),
  }));
  const entityFrequency = entityResult.rows.map((row) => ({
    entity: row.entity,
    frequency: Number(row.frequency),
  }));

  const dominantSentiment =
    sentimentSummary.positiveCount > sentimentSummary.neutralCount &&
    sentimentSummary.positiveCount > sentimentSummary.negativeCount
      ? "positive"
      : sentimentSummary.negativeCount >
            sentimentSummary.neutralCount &&
          sentimentSummary.negativeCount >
            sentimentSummary.positiveCount
        ? "negative"
        : "neutral";

  const topEntity = entityFrequency[0]?.entity ?? "various entities";
  const topEntityCount = entityFrequency[0]?.frequency ?? 0;

  const aiInsights: AIInsights = {
    topic:
      filters.selectedTopics.length > 0
        ? filters.selectedTopics.join(", ")
        : "All topics",
    dateRange: filters.dateRange,
    topTopics,
    entityFrequency,
    sentimentSummary,
    summaryText: `Analysis of ${filteredArticleCount} articles ${
      filters.selectedTopics.length > 0
        ? `on ${filters.selectedTopics.join(", ")}`
        : "across topics"
    } from ${filters.dateRange.start} to ${filters.dateRange.end}. ${topEntity} is the most mentioned entity with ${topEntityCount} occurrences. Overall sentiment is ${dominantSentiment} with ${sentimentSummary.positiveCount} positive, ${sentimentSummary.neutralCount} neutral, and ${sentimentSummary.negativeCount} negative articles.`,
  };

  return {
    filteredArticleCount,
    countryCounts: Object.fromEntries(
      countryResult.rows.map((row) => [
        row.countryCode,
        Number(row.count),
      ]),
    ),
    aiInsights,
  };
}

export async function getArticlesPage(
  filters: DashboardFilters,
  cursor: ArticleCursor | null,
  limit: number,
) {
  const pool = getPool();
  const filterQuery = buildFilterQuery(filters);
  const values: Array<string | string[] | number> = [
    ...filterQuery.values,
  ];
  const conditions = [filterQuery.whereClause.replace(/^WHERE\s+/, "")];

  if (cursor) {
    conditions.push(
      `(sort_order, id) > ($${values.push(cursor.sortOrder)}::int, $${values.push(cursor.id)})`,
    );
  }

  const query = `
    SELECT
      id,
      sort_order,
      title,
      source,
      url,
      country,
      country_code,
      topic,
      published_date::text,
      sentiment,
      sentiment_score,
      entities,
      keywords,
      lat,
      lng
    FROM public.articles
    WHERE ${conditions.join(" AND ")}
    ORDER BY sort_order ASC, id ASC
    LIMIT $${values.push(limit + 1)}
  `;

  const result = await pool.query<QueryArticleRow>(query, values);
  const rows = result.rows.slice(0, limit);
  const nextRow = result.rows[limit];

  return {
    items: rows.map(mapArticle),
    nextCursor: nextRow
      ? encodeCursor({
          sortOrder: nextRow.sort_order,
          id: nextRow.id,
        })
      : null,
  };
}

function getDimensionSource(dimension: TrendDimension) {
  if (dimension === "sentiment") {
    return "SELECT period, sort_order, sentiment AS key FROM filtered";
  }

  if (dimension === "entities") {
    return "SELECT period, entity AS key FROM filtered CROSS JOIN LATERAL unnest(entities) AS entity";
  }

  if (dimension === "countries") {
    return "SELECT period, sort_order, country AS key FROM filtered";
  }

  return "SELECT period, sort_order, topic AS key FROM filtered";
}

export async function getTrendPoints(
  filters: DashboardFilters,
  dimension: TrendDimension,
) {
  const pool = getPool();
  const { values, whereClause } = buildFilterQuery(filters);
  const periodExpression = getPeriodExpression(filters.granularity);

  const valuesQuery =
    dimension === "entities"
      ? `
        WITH filtered AS (
          SELECT *, ${periodExpression} AS period
          FROM public.articles
          ${whereClause}
        ),
        entity_rows AS (
          SELECT
            period,
            sort_order,
            entity_rows.entity,
            entity_rows.entity_position
          FROM filtered
          CROSS JOIN LATERAL unnest(entities) WITH ORDINALITY AS entity_rows(entity, entity_position)
        ),
        counts AS (
          SELECT
            period,
            entity AS key,
            COUNT(*)::int AS count,
            MIN(sort_order)::int AS first_sort_order
          FROM entity_rows
          GROUP BY period, entity
        ),
        first_occurrence AS (
          SELECT DISTINCT ON (period, entity)
            period,
            entity AS key,
            sort_order AS first_sort_order,
            entity_position AS first_entity_position
          FROM entity_rows
          ORDER BY period, entity, sort_order ASC, entity_position ASC
        ),
        ranked AS (
          SELECT
            counts.period,
            counts.key,
            counts.count,
            counts.first_sort_order,
            first_occurrence.first_entity_position,
            ROW_NUMBER() OVER (
              PARTITION BY counts.period
              ORDER BY counts.count DESC, counts.first_sort_order ASC, first_occurrence.first_entity_position ASC, counts.key ASC
            ) AS rank
          FROM counts
          INNER JOIN first_occurrence
            ON first_occurrence.period = counts.period
           AND first_occurrence.key = counts.key
        )
        SELECT period, key, count, first_entity_position
        FROM ranked
        WHERE rank <= 5
        ORDER BY period ASC, count DESC, first_sort_order ASC, first_entity_position ASC, key ASC
      `
      : `
        WITH filtered AS (
          SELECT *, ${periodExpression} AS period
          FROM public.articles
          ${whereClause}
        )
        SELECT
          period,
          key,
          COUNT(*)::int AS count,
          MIN(sort_order)::int AS first_sort_order
        FROM (${getDimensionSource(dimension)}) AS dimension_rows
        GROUP BY period, key
        ORDER BY period ASC, count DESC, first_sort_order ASC, key ASC
      `;

  const metadataQuery = `
    WITH filtered AS (
      SELECT *, ${periodExpression} AS period
      FROM public.articles
      ${whereClause}
    ),
    topic_counts AS (
      SELECT
        period,
        topic,
        COUNT(*)::int AS count,
        MIN(sort_order)::int AS first_sort_order,
        ROW_NUMBER() OVER (
          PARTITION BY period
          ORDER BY COUNT(*) DESC, MIN(sort_order) ASC, topic ASC
        ) AS rank
      FROM filtered
      GROUP BY period, topic
    )
    SELECT
      filtered.period,
      COUNT(*)::int AS "totalArticles",
      COUNT(*) FILTER (WHERE sentiment = 'positive')::int AS positive,
      COUNT(*) FILTER (WHERE sentiment = 'neutral')::int AS neutral,
      COUNT(*) FILTER (WHERE sentiment = 'negative')::int AS negative,
      MAX(CASE WHEN topic_counts.rank = 1 THEN topic_counts.topic END) AS "dominantTopic"
    FROM filtered
    LEFT JOIN topic_counts
      ON topic_counts.period = filtered.period
     AND topic_counts.rank = 1
    GROUP BY filtered.period
    ORDER BY filtered.period ASC
  `;

  const [valuesResult, metadataResult, totalResult] =
    await Promise.all([
      pool.query<{ period: string; key: string; count: number }>(
        valuesQuery,
        values,
      ),
      pool.query<{
        period: string;
        totalArticles: number;
        positive: number;
        neutral: number;
        negative: number;
        dominantTopic: string | null;
      }>(metadataQuery, values),
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM public.articles
         ${whereClause}`,
        values,
      ),
    ]);

  const pointMap = new Map<string, TrendPoint>();

  for (const metadata of metadataResult.rows) {
    pointMap.set(metadata.period, {
      period: metadata.period,
      totalArticles: metadata.totalArticles,
      dominantTopic: metadata.dominantTopic ?? "N/A",
      sentimentBreakdown: {
        positive: metadata.positive,
        neutral: metadata.neutral,
        negative: metadata.negative,
      },
      values: [],
    });
  }

  for (const row of valuesResult.rows) {
    const point = pointMap.get(row.period);

    if (!point) {
      continue;
    }

    point.values.push({ key: row.key, count: row.count });
  }

  return {
    filteredArticleCount: Number(totalResult.rows[0]?.count ?? "0"),
    points: [...pointMap.values()],
  };
}
