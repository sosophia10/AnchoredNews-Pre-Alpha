/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Verifies that Supabase contains the expected article dataset and
 * that the key fields needed by the dashboard query layer are populated.
 */

import { getPool } from "../db/pool.js";

async function verifyDatabase() {
  const pool = getPool();

  try {
    const [countResult, boundsResult, nullCheckResult] =
      await Promise.all([
        pool.query<{ count: string }>(
          "SELECT COUNT(*)::text AS count FROM public.articles",
        ),
        pool.query<{ start: string; end: string }>(
          `SELECT
             MIN(published_date)::text AS start,
             MAX(published_date)::text AS "end"
           FROM public.articles`,
        ),
        pool.query<{
          missing_title: string;
          missing_topic: string;
          missing_country_code: string;
          missing_sort_order: string;
        }>(
          `SELECT
             COUNT(*) FILTER (WHERE title IS NULL OR title = '')::text AS missing_title,
             COUNT(*) FILTER (WHERE topic IS NULL OR topic = '')::text AS missing_topic,
             COUNT(*) FILTER (WHERE country_code IS NULL OR country_code = '')::text AS missing_country_code,
             COUNT(*) FILTER (WHERE sort_order IS NULL)::text AS missing_sort_order
           FROM public.articles`,
        ),
      ]);

    console.log(
      JSON.stringify(
        {
          articleCount: Number(countResult.rows[0]?.count ?? "0"),
          dateBounds: boundsResult.rows[0] ?? null,
          missingFieldCounts: nullCheckResult.rows[0] ?? null,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

verifyDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});
