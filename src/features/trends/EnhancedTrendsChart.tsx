/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Rebuilds the exported trends experience with interchangeable
 * dimensions, chart modes, and period filtering while loading aggregated
 * trend data from PostgreSQL instead of the full browser-side article corpus.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Layers, TrendingUp, X } from "lucide-react";
import { fetchTrendResponse } from "@/features/dashboard/api/dashboardApi";
import type {
  DateRange,
  Granularity,
  TrendDimension,
  TrendPoint,
} from "@/shared/types";

interface EnhancedTrendsChartProps {
  selectedCountries: string[];
  granularity: Granularity;
  dateRange: DateRange;
  selectedTopics: string[];
  selectedPeriod: string | null;
  searchQuery: string;
  onPeriodClick: (period: string | null) => void;
}

type ChartType = "line" | "stackedBar";

const DIMENSION_COLORS: Record<string, string> = {
  Politics: "#58c1d8",
  Business: "#7dd3f0",
  Technology: "#ffa726",
  Economy: "#ab47bc",
  Health: "#66bb6a",
  Science: "#ef5350",
  Culture: "#42a5f5",
  Sports: "#ffca28",
  Entertainment: "#26c6da",
  Education: "#ec407a",
  positive: "#66bb6a",
  neutral: "#8ba3b8",
  negative: "#ef5350",
  "United States": "#58c1d8",
  Japan: "#7dd3f0",
  "United Kingdom": "#ffa726",
  Italy: "#ab47bc",
  Canada: "#66bb6a",
  China: "#ef5350",
  Germany: "#42a5f5",
  France: "#ffca28",
  "South Korea": "#26c6da",
  Brazil: "#ec407a",
  India: "#9c27b0",
  Australia: "#00bcd4",
  Mexico: "#ff9800",
  Spain: "#e91e63",
  Netherlands: "#3f51b5",
};

interface ChartDataPoint {
  period: string;
  _total: number;
  _metadata: {
    totalArticles: number;
    dominantTopic: string;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  [key: string]:
    | string
    | number
    | ChartDataPoint["_metadata"];
}

function formatPeriod(period: string, granularity: Granularity) {
  const date = new Date(period);

  if (granularity === "daily") {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  if (granularity === "weekly") {
    return `Week of ${date.getMonth() + 1}/${date.getDate()}`;
  }

  return `${date.toLocaleString("default", {
    month: "short",
  })} ${date.getFullYear()}`;
}

function renderLegendLabel(value: string): ReactNode {
  const truncated =
    value.length > 15 ? `${value.slice(0, 15)}...` : value;

  return (
    <span className="text-[#dfe7ef]" title={value}>
      {truncated}
    </span>
  );
}

export function EnhancedTrendsChart({
  selectedCountries,
  granularity,
  dateRange,
  selectedTopics,
  selectedPeriod,
  searchQuery,
  onPeriodClick,
}: EnhancedTrendsChartProps) {
  const [dimension, setDimension] =
    useState<TrendDimension>("topics");
  const [chartType, setChartType] =
    useState<ChartType>("stackedBar");
  const [normalized, setNormalized] = useState(false);
  const [showAllEntities, setShowAllEntities] = useState(false);
  const [trendPoints, setTrendPoints] = useState<TrendPoint[]>([]);
  const [filteredArticleCount, setFilteredArticleCount] =
    useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();

    setIsLoading(true);
    setError(null);

    void fetchTrendResponse(
      {
        searchQuery,
        selectedTopics,
        selectedCountries,
        dateRange,
        granularity,
        selectedPeriod,
      },
      dimension,
      abortController.signal,
    )
      .then((response) => {
        setTrendPoints(response.points);
        setFilteredArticleCount(response.filteredArticleCount);
      })
      .catch((fetchError) => {
        if (abortController.signal.aborted) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Trend query failed.",
        );
        setTrendPoints([]);
        setFilteredArticleCount(0);
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => abortController.abort();
  }, [
    dateRange.end,
    dateRange.start,
    dimension,
    granularity,
    searchQuery,
    selectedCountries,
    selectedPeriod,
    selectedTopics,
  ]);

  const handleChartClick = (data: { activeLabel?: string }) => {
    if (!data.activeLabel) {
      return;
    }

    onPeriodClick(
      selectedPeriod === data.activeLabel ? null : data.activeLabel,
    );
  };

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const baseData = trendPoints
      .map((point) => {
        const dataPoint: ChartDataPoint = {
          period: point.period,
          _total: point.totalArticles,
          _metadata: {
            totalArticles: point.totalArticles,
            dominantTopic: point.dominantTopic,
            sentimentBreakdown: point.sentimentBreakdown,
          },
        };

        for (const value of point.values) {
          dataPoint[value.key] = value.count;
        }

        return dataPoint;
      })
      .sort((left, right) =>
        left.period.localeCompare(right.period),
      );

    if (!normalized || chartType !== "stackedBar") {
      return baseData;
    }

    return baseData.map((point) => {
      const nextPoint: ChartDataPoint = {
        period: point.period,
        _total: point._total,
        _metadata: point._metadata,
      };

      for (const key of Object.keys(point)) {
        if (key.startsWith("_") || key === "period") {
          continue;
        }

        const value = point[key];
        if (typeof value === "number") {
          nextPoint[key] =
            point._total > 0 ? (value / point._total) * 100 : 0;
        }
      }

      return nextPoint;
    });
  }, [chartType, normalized, trendPoints]);

  const dimensionKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const point of chartData) {
      for (const key of Object.keys(point)) {
        if (!key.startsWith("_") && key !== "period") {
          keys.add(key);
        }
      }
    }

    const allKeys = [...keys];

    if (dimension !== "entities") {
      return allKeys.sort();
    }

    // Entity mode can explode in cardinality, so the UI retains the
    // exported "show more" behavior on top of the SQL-backed aggregates.
    const entityCounts: Record<string, number> = {};

    for (const point of chartData) {
      for (const key of allKeys) {
        const value = point[key];
        if (typeof value === "number") {
          entityCounts[key] = (entityCounts[key] ?? 0) + value;
        }
      }
    }

    const sortedKeys = allKeys.sort(
      (left, right) =>
        (entityCounts[right] ?? 0) - (entityCounts[left] ?? 0),
    );

    return showAllEntities
      ? sortedKeys
      : sortedKeys.slice(0, 60);
  }, [chartData, dimension, showAllEntities]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) {
      return null;
    }

    const metadata = payload[0]?.payload?._metadata as
      | ChartDataPoint["_metadata"]
      | undefined;

    if (!metadata) {
      return null;
    }

    return (
      <div className="rounded-lg border border-[#3c5e87] bg-[#1a2f42] p-3 shadow-lg">
        <div className="mb-2 text-sm font-medium text-[#dfe7ef]">
          {formatPeriod(label, granularity)}
        </div>
        <div className="space-y-1 text-xs">
          <div className="text-[#8ba3b8]">
            <span className="font-medium text-[#dfe7ef]">
              {metadata.totalArticles}
            </span>{" "}
            articles
          </div>
          <div className="text-[#8ba3b8]">
            Dominant Topic:{" "}
            <span className="text-[#dfe7ef]">
              {metadata.dominantTopic}
            </span>
          </div>
          <div className="flex items-center gap-2 border-t border-[#3c5e87]/50 pt-1">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[#8ba3b8]">
                {metadata.sentimentBreakdown.positive}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-gray-500" />
              <span className="text-[#8ba3b8]">
                {metadata.sentimentBreakdown.neutral}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[#8ba3b8]">
                {metadata.sentimentBreakdown.negative}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0d1f2f] p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <div className="mb-3 text-center">
          <h2 className="mb-1 text-base font-medium text-[#dfe7ef] md:text-lg">
            Trend Analysis:{" "}
            {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <p className="text-xs text-[#8ba3b8] md:text-sm">
              {chartData.length} periods | {granularity} view |
              <span
                className={
                  filteredArticleCount === 0
                    ? "font-medium text-[#ef5350]"
                    : "font-medium text-[#58c1d8]"
                }
              >
                {" "}
                {filteredArticleCount} articles
              </span>
            </p>
            {selectedTopics.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded border border-[#58c1d8]/30 bg-[#58c1d8]/10 px-2 py-0.5 text-xs text-[#58c1d8]">
                Topics: {selectedTopics.join(", ")}
              </span>
            ) : null}
            {selectedCountries.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded border border-[#58c1d8]/30 bg-[#58c1d8]/10 px-2 py-0.5 text-xs text-[#58c1d8]">
                {selectedCountries.length}{" "}
                {selectedCountries.length === 1
                  ? "country"
                  : "countries"}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded border border-[#58c1d8]/30 bg-[#58c1d8]/10 px-2 py-0.5 text-xs text-[#58c1d8]">
              Range: {dateRange.start} to {dateRange.end}
            </span>
            {normalized ? (
              <span className="inline-flex items-center gap-1 rounded border border-[#ffa726]/30 bg-[#ffa726]/10 px-2 py-0.5 text-xs text-[#ffa726]">
                Normalized
              </span>
            ) : null}
            {selectedPeriod ? (
              <button
                onClick={() => onPeriodClick(null)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#58c1d8] bg-[#58c1d8]/20 px-2 py-0.5 text-xs font-medium text-[#58c1d8] transition-colors hover:bg-[#58c1d8]/30"
                title="Click to clear period filter"
              >
                Period: {formatPeriod(selectedPeriod, granularity)}
                <X size={12} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-[#1a2f42] p-1 md:gap-1">
            {(
              ["topics", "sentiment", "entities", "countries"] as const
            ).map((value) => (
              <button
                key={value}
                onClick={() => {
                  setDimension(value);
                  if (value !== "entities") {
                    setShowAllEntities(false);
                  }
                }}
                className={`rounded px-2 py-1.5 text-xs font-medium transition-colors md:px-3 ${
                  dimension === value
                    ? "bg-[#58c1d8] text-[#0b1c2c]"
                    : "text-[#8ba3b8] hover:text-[#dfe7ef]"
                }`}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-[#1a2f42] p-1">
            <button
              onClick={() => setChartType("line")}
              className={`rounded p-1.5 transition-colors ${
                chartType === "line"
                  ? "bg-[#58c1d8] text-[#0b1c2c]"
                  : "text-[#8ba3b8] hover:text-[#dfe7ef]"
              }`}
              title="Line Chart"
            >
              <TrendingUp size={16} />
            </button>
            <button
              onClick={() => setChartType("stackedBar")}
              className={`rounded p-1.5 transition-colors ${
                chartType === "stackedBar"
                  ? "bg-[#58c1d8] text-[#0b1c2c]"
                  : "text-[#8ba3b8] hover:text-[#dfe7ef]"
              }`}
              title="Stacked Bar Chart"
            >
              <BarChart3 size={16} />
            </button>
          </div>

          {chartType === "stackedBar" ? (
            <button
              onClick={() => setNormalized((current) => !current)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                normalized
                  ? "bg-[#58c1d8] text-[#0b1c2c]"
                  : "bg-[#1a2f42] text-[#8ba3b8] hover:text-[#dfe7ef]"
              }`}
            >
              <Layers size={14} />
              <span className="hidden sm:inline">Normalize</span>
              <span className="sm:hidden">%</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-sm text-[#8ba3b8]">
              Loading trend data...
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md rounded border border-[#ef5350]/30 bg-[#1a2f42] p-4 text-center text-sm text-[#dfe7ef]">
              {error}
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="mb-2 text-sm text-[#8ba3b8]">
                No data available for the selected filters
              </p>
              <p className="text-xs text-[#8ba3b8]">
                Try adjusting your date range or filters
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart
                data={chartData}
                onClick={handleChartClick}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#3c5e87"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="period"
                  stroke="#8ba3b8"
                  tick={{ fill: "#8ba3b8", fontSize: 12 }}
                  tickFormatter={(value) =>
                    formatPeriod(value, granularity)
                  }
                />
                <YAxis
                  stroke="#8ba3b8"
                  tick={{ fill: "#8ba3b8", fontSize: 12 }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend
                  wrapperStyle={{
                    color: "#dfe7ef",
                    fontSize: "12px",
                  }}
                  iconType="line"
                  formatter={renderLegendLabel}
                />
                {dimensionKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key}
                    stroke={
                      DIMENSION_COLORS[key] ??
                      `hsl(${(index * 360) / Math.max(dimensionKeys.length, 1)}, 70%, 60%)`
                    }
                    strokeWidth={2}
                    dot={{
                      fill:
                        DIMENSION_COLORS[key] ??
                        `hsl(${(index * 360) / Math.max(dimensionKeys.length, 1)}, 70%, 60%)`,
                      r: 3,
                    }}
                    activeDot={{ r: 5 }}
                    animationDuration={500}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart
                data={chartData}
                onClick={handleChartClick}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#3c5e87"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="period"
                  stroke="#8ba3b8"
                  tick={{ fill: "#8ba3b8", fontSize: 12 }}
                  tickFormatter={(value) =>
                    formatPeriod(value, granularity)
                  }
                />
                <YAxis
                  stroke="#8ba3b8"
                  tick={{ fill: "#8ba3b8", fontSize: 12 }}
                  label={
                    normalized
                      ? {
                          value: "Percentage (%)",
                          angle: -90,
                          position: "insideLeft",
                          fill: "#8ba3b8",
                        }
                      : undefined
                  }
                />
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend
                  wrapperStyle={{
                    color: "#dfe7ef",
                    fontSize: "12px",
                  }}
                  formatter={renderLegendLabel}
                />
                {dimensionKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    name={key}
                    stackId="a"
                    fill={
                      DIMENSION_COLORS[key] ??
                      `hsl(${(index * 360) / Math.max(dimensionKeys.length, 1)}, 70%, 60%)`
                    }
                    animationDuration={500}
                    cursor="pointer"
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {dimension === "entities" &&
      !showAllEntities &&
      chartData.length > 0 ? (
        <div className="mt-2 flex justify-center">
          <button
            onClick={() => setShowAllEntities(true)}
            className="rounded bg-[#3c5e87] px-4 py-2 text-sm text-[#dfe7ef] transition-colors hover:bg-[#496a94]"
          >
            Show More Entities
          </button>
        </div>
      ) : null}

      {dimension === "entities" && showAllEntities ? (
        <div className="mt-2 flex justify-center">
          <button
            onClick={() => setShowAllEntities(false)}
            className="rounded bg-[#3c5e87] px-4 py-2 text-sm text-[#dfe7ef] transition-colors hover:bg-[#496a94]"
          >
            Show Less
          </button>
        </div>
      ) : null}
    </div>
  );
}
