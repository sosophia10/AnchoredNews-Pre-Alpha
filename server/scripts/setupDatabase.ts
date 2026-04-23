/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Creates the PostgreSQL article table/indexes and seeds it from the
 * preserved mock dataset so the dashboard can run against SQL locally or in deployment.
 */

import { articlesData } from "../../src/data/mockData.js";
import { getPool } from "../db/pool.js";

async function setupDatabase() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.articles (
        id TEXT PRIMARY KEY,
        sort_order INTEGER NOT NULL,
        title TEXT NOT NULL,
        source TEXT NOT NULL,
        url TEXT NOT NULL,
        country TEXT NOT NULL,
        country_code TEXT NOT NULL,
        topic TEXT NOT NULL,
        published_date DATE NOT NULL,
        sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
        sentiment_score DOUBLE PRECISION NOT NULL,
        entities TEXT[] NOT NULL DEFAULT '{}',
        keywords TEXT[] NOT NULL DEFAULT '{}',
        search_text TEXT NOT NULL DEFAULT '',
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL
      )
    `);
    await client.query(
      "ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS sort_order INTEGER",
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS articles_sort_order_idx ON public.articles (sort_order ASC, id ASC)",
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS articles_topic_idx ON public.articles (topic)",
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS articles_country_code_idx ON public.articles (country_code)",
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS articles_search_trgm_idx ON public.articles USING GIN (search_text gin_trgm_ops)",
    );

    for (const [index, article] of articlesData.entries()) {
      const searchText = [
        article.title,
        article.source,
        article.keywords.join(" "),
        article.entities.join(" "),
      ]
        .filter(Boolean)
        .join(" ");

      await client.query(
        `
          INSERT INTO public.articles (
            id,
            sort_order,
            title,
            source,
            url,
            country,
            country_code,
            topic,
            published_date,
            sentiment,
            sentiment_score,
            entities,
            keywords,
            search_text,
            lat,
            lng
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9::date, $10, $11, $12::text[], $13::text[], $14, $15, $16
          )
          ON CONFLICT (id) DO UPDATE SET
            sort_order = EXCLUDED.sort_order,
            title = EXCLUDED.title,
            source = EXCLUDED.source,
            url = EXCLUDED.url,
            country = EXCLUDED.country,
            country_code = EXCLUDED.country_code,
            topic = EXCLUDED.topic,
            published_date = EXCLUDED.published_date,
            sentiment = EXCLUDED.sentiment,
            sentiment_score = EXCLUDED.sentiment_score,
            entities = EXCLUDED.entities,
            keywords = EXCLUDED.keywords,
            search_text = EXCLUDED.search_text,
            lat = EXCLUDED.lat,
            lng = EXCLUDED.lng
        `,
        [
          article.id,
          index,
          article.title,
          article.source,
          article.url,
          article.country,
          article.countryCode,
          article.topic,
          article.publishedDate,
          article.sentiment,
          article.sentimentScore,
          article.entities,
          article.keywords,
          searchText,
          article.lat,
          article.lng,
        ],
      );
    }

    await client.query("COMMIT");
    console.log(
      `Seeded PostgreSQL with ${articlesData.length} articles.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});
