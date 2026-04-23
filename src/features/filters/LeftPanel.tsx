/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Rebuilds the left rail and drawer content for news, filters, and
 * map adjustment controls while keeping the exported information architecture.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  FileText,
  Filter,
  Settings,
  X,
} from "lucide-react";
import type {
  Article,
  AvailableCountry,
  DashboardDrawer,
  DateRange,
} from "@/shared/types";

interface LeftPanelProps {
  activeDrawer: DashboardDrawer;
  articles: Article[];
  articleTotalCount: number;
  articlesLoading: boolean;
  articlesLoadingMore: boolean;
  hasMoreArticles: boolean;
  availableTopics: string[];
  selectedTopics: string[];
  availableCountries: AvailableCountry[];
  dateRange: DateRange;
  selectedCountries: string[];
  searchQuery: string;
  selectedPeriod: string | null;
  onDrawerChange: (
    drawer: Exclude<DashboardDrawer, null> | null,
  ) => void;
  onTopicToggle: (topic: string) => void;
  onDateRangeChange: (range: DateRange) => void;
  onCountryToggle: (countryCode: string) => void;
  onClearFilters: () => void;
  onArticleClick: (article: Article) => void;
  onSearchChange: (query: string) => void;
  onPeriodChange: (period: string | null) => void;
  onLoadMoreArticles: () => void;
}

const ARTICLE_ROW_HEIGHT = 124;
const ARTICLE_OVERSCAN = 6;

export function LeftPanel({
  activeDrawer,
  articles,
  articleTotalCount,
  articlesLoading,
  articlesLoadingMore,
  hasMoreArticles,
  availableTopics,
  selectedTopics,
  availableCountries,
  dateRange,
  selectedCountries,
  searchQuery,
  selectedPeriod,
  onDrawerChange,
  onTopicToggle,
  onDateRangeChange,
  onCountryToggle,
  onClearFilters,
  onArticleClick,
  onSearchChange,
  onPeriodChange,
  onLoadMoreArticles,
}: LeftPanelProps) {
  return (
    <div className="flex h-full">
      <div className="flex w-14 flex-col items-center gap-2 border-r border-[#3c5e87]/30 bg-[#1a2f42] py-4">
        <RailButton
          title="News List"
          isActive={activeDrawer === "news"}
          onClick={() =>
            onDrawerChange(
              activeDrawer === "news" ? null : "news",
            )
          }
          icon={<FileText size={20} />}
        />
        <RailButton
          title="Filters"
          isActive={activeDrawer === "filter"}
          onClick={() =>
            onDrawerChange(
              activeDrawer === "filter" ? null : "filter",
            )
          }
          icon={<Filter size={20} />}
        />
        <RailButton
          title="Adjust Map"
          isActive={activeDrawer === "adjust"}
          onClick={() =>
            onDrawerChange(
              activeDrawer === "adjust" ? null : "adjust",
            )
          }
          icon={<Settings size={20} />}
        />
      </div>

      {activeDrawer ? (
        <div className="flex w-80 flex-col border-r border-[#3c5e87]/30 bg-[#0b1c2c]">
          <div className="flex h-14 items-center justify-between border-b border-[#3c5e87]/30 px-4">
            <h3 className="text-base font-medium text-[#dfe7ef]">
              {activeDrawer === "news" && "News Articles"}
              {activeDrawer === "filter" && "Filters"}
              {activeDrawer === "adjust" && "Adjust Map"}
            </h3>
            <button
              onClick={() => onDrawerChange(null)}
              className="text-[#8ba3b8] transition-colors hover:text-[#dfe7ef]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeDrawer === "news" ? (
              <NewsDrawer
                articles={articles}
                articleTotalCount={articleTotalCount}
                isLoading={articlesLoading}
                isLoadingMore={articlesLoadingMore}
                hasMoreArticles={hasMoreArticles}
                onLoadMoreArticles={onLoadMoreArticles}
                onArticleClick={onArticleClick}
              />
            ) : null}

            {activeDrawer === "filter" ? (
              <FiltersDrawer
                availableTopics={availableTopics}
                selectedTopics={selectedTopics}
                availableCountries={availableCountries}
                dateRange={dateRange}
                selectedCountries={selectedCountries}
                searchQuery={searchQuery}
                selectedPeriod={selectedPeriod}
                onTopicToggle={onTopicToggle}
                onDateRangeChange={onDateRangeChange}
                onCountryToggle={onCountryToggle}
                onClearFilters={onClearFilters}
                onSearchChange={onSearchChange}
                onPeriodChange={onPeriodChange}
              />
            ) : null}

            {activeDrawer === "adjust" ? <AdjustDrawer /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RailButton({
  title,
  isActive,
  onClick,
  icon,
}: {
  title: string;
  isActive: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
        isActive
          ? "bg-[#58c1d8] text-[#0b1c2c]"
          : "text-[#8ba3b8] hover:bg-[#3c5e87] hover:text-[#dfe7ef]"
      }`}
    >
      {icon}
    </button>
  );
}

function NewsDrawer({
  articles,
  articleTotalCount,
  isLoading,
  isLoadingMore,
  hasMoreArticles,
  onLoadMoreArticles,
  onArticleClick,
}: {
  articles: Article[];
  articleTotalCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreArticles: boolean;
  onLoadMoreArticles: () => void;
  onArticleClick: (article: Article) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(containerRef.current?.clientHeight ?? 0);
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    return () =>
      window.removeEventListener("resize", updateViewportHeight);
  }, []);

  const totalRows =
    articles.length + (hasMoreArticles || isLoadingMore ? 1 : 0);
  const visibleRowCount = Math.max(
    1,
    Math.ceil(viewportHeight / ARTICLE_ROW_HEIGHT) +
      ARTICLE_OVERSCAN * 2,
  );
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ARTICLE_ROW_HEIGHT) - ARTICLE_OVERSCAN,
  );
  const endIndex = Math.min(totalRows, startIndex + visibleRowCount);

  useEffect(() => {
    if (
      hasMoreArticles &&
      !isLoadingMore &&
      endIndex >= articles.length - 8
    ) {
      onLoadMoreArticles();
    }
  }, [
    articles.length,
    endIndex,
    hasMoreArticles,
    isLoadingMore,
    onLoadMoreArticles,
  ]);

  const visibleIndexes = useMemo(() => {
    return Array.from(
      { length: Math.max(0, endIndex - startIndex) },
      (_, index) => startIndex + index,
    );
  }, [endIndex, startIndex]);

  if (isLoading && articles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-[#8ba3b8]">
        Loading articles...
      </div>
    );
  }

  if (!isLoading && articleTotalCount === 0) {
    return (
      <div className="flex h-full flex-col p-4">
        <div className="mb-2 text-xs text-[#8ba3b8]">
          0 articles found
        </div>
        <div className="rounded bg-[#1a2f42] p-4 text-sm text-[#8ba3b8]">
          No articles match the current filters.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-2 text-xs text-[#8ba3b8]">
        {articleTotalCount} articles found
      </div>

      <div
        ref={containerRef}
        onScroll={(event) =>
          setScrollTop(event.currentTarget.scrollTop)
        }
        className="flex-1 overflow-y-auto pr-1"
      >
        <div
          className="relative"
          style={{ height: totalRows * ARTICLE_ROW_HEIGHT }}
        >
          {visibleIndexes.map((index) => {
            const article = articles[index];

            if (!article) {
              return (
                <div
                  key={`loading-${index}`}
                  className="absolute left-0 right-0 rounded bg-[#1a2f42] px-3 py-4 text-sm text-[#8ba3b8]"
                  style={{
                    top: index * ARTICLE_ROW_HEIGHT,
                    height: ARTICLE_ROW_HEIGHT - 12,
                  }}
                >
                  {isLoadingMore
                    ? "Loading more articles..."
                    : "Preparing next results..."}
                </div>
              );
            }

            return (
              <button
                key={article.id}
                onClick={() => onArticleClick(article)}
                className="absolute left-0 right-0 rounded bg-[#1a2f42] p-3 text-left transition-colors hover:bg-[#3c5e87]"
                style={{
                  top: index * ARTICLE_ROW_HEIGHT,
                  height: ARTICLE_ROW_HEIGHT - 12,
                }}
              >
                <h4 className="mb-1 line-clamp-2 text-sm font-medium text-[#dfe7ef]">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-[#8ba3b8]">
                  <span>{article.source}</span>
                  <span>&bull;</span>
                  <span>{article.country}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      article.sentiment === "positive"
                        ? "bg-green-500/20 text-green-400"
                        : article.sentiment === "negative"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {article.sentiment}
                  </span>
                  <span className="text-xs text-[#8ba3b8]">
                    {article.publishedDate}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FiltersDrawer({
  availableTopics,
  selectedTopics,
  availableCountries,
  dateRange,
  selectedCountries,
  searchQuery,
  selectedPeriod,
  onTopicToggle,
  onDateRangeChange,
  onCountryToggle,
  onClearFilters,
  onSearchChange,
  onPeriodChange,
}: {
  availableTopics: string[];
  selectedTopics: string[];
  availableCountries: AvailableCountry[];
  dateRange: DateRange;
  selectedCountries: string[];
  searchQuery: string;
  selectedPeriod: string | null;
  onTopicToggle: (topic: string) => void;
  onDateRangeChange: (range: DateRange) => void;
  onCountryToggle: (countryCode: string) => void;
  onClearFilters: () => void;
  onSearchChange: (query: string) => void;
  onPeriodChange: (period: string | null) => void;
}) {
  return (
    <div className="h-full space-y-6 overflow-y-auto p-4">
      {selectedPeriod ? (
        <div className="rounded border border-[#58c1d8]/30 bg-[#58c1d8]/10 p-3">
          <div className="mb-1 flex items-start justify-between">
            <div className="text-xs font-medium text-[#58c1d8]">
              Filtered by Period
            </div>
            <button
              onClick={() => onPeriodChange(null)}
              className="-mt-0.5 text-[#58c1d8] transition-colors hover:text-[#dfe7ef]"
              title="Clear period filter"
            >
              <X size={14} />
            </button>
          </div>
          <div className="text-sm text-[#dfe7ef]">
            {selectedPeriod}
          </div>
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-[#dfe7ef]">
          Search
        </label>
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded border border-[#3c5e87]/50 bg-[#1a2f42] px-3 py-2 text-sm text-[#dfe7ef] placeholder:text-[#8ba3b8]/50 focus:outline-none focus:ring-1 focus:ring-[#58c1d8]"
        />
      </div>

      <FilterSection title="Topics">
        <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-[#3c5e87]/50 bg-[#1a2f42] p-2">
          {availableTopics.map((topic) => (
            <label
              key={topic}
              className="flex cursor-pointer items-center gap-2 rounded p-1.5 transition-colors hover:bg-[#3c5e87]/30"
            >
              <input
                type="checkbox"
                checked={selectedTopics.includes(topic)}
                onChange={() => onTopicToggle(topic)}
                className="h-4 w-4 rounded border-[#3c5e87] bg-[#0b1c2c] text-[#58c1d8] focus:ring-1 focus:ring-[#58c1d8] focus:ring-offset-0"
              />
              <span className="text-sm text-[#dfe7ef]">{topic}</span>
            </label>
          ))}
        </div>
        {selectedTopics.length > 0 ? (
          <TagList
            items={selectedTopics.map((topic) => ({
              key: topic,
              label: topic,
              onRemove: () => onTopicToggle(topic),
            }))}
          />
        ) : null}
      </FilterSection>

      <FilterSection title="Countries">
        <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-[#3c5e87]/50 bg-[#1a2f42] p-2">
          {availableCountries.map((country) => (
            <label
              key={country.code}
              className="flex cursor-pointer items-center gap-2 rounded p-1.5 transition-colors hover:bg-[#3c5e87]/30"
            >
              <input
                type="checkbox"
                checked={selectedCountries.includes(country.code)}
                onChange={() => onCountryToggle(country.code)}
                className="h-4 w-4 rounded border-[#3c5e87] bg-[#0b1c2c] text-[#58c1d8] focus:ring-1 focus:ring-[#58c1d8] focus:ring-offset-0"
              />
              <span className="text-sm text-[#dfe7ef]">
                {country.name}
              </span>
            </label>
          ))}
        </div>
        {selectedCountries.length > 0 ? (
          <TagList
            items={selectedCountries.map((code) => ({
              key: code,
              label:
                availableCountries.find(
                  (country) => country.code === code,
                )?.name ?? code,
              onRemove: () => onCountryToggle(code),
            }))}
          />
        ) : null}
      </FilterSection>

      <FilterSection title="Date Range">
        <div className="space-y-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(event) =>
              onDateRangeChange({
                ...dateRange,
                start: event.target.value,
              })
            }
            className="w-full rounded border border-[#3c5e87]/50 bg-[#1a2f42] px-3 py-2 text-sm text-[#dfe7ef] focus:outline-none focus:ring-1 focus:ring-[#58c1d8]"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(event) =>
              onDateRangeChange({
                ...dateRange,
                end: event.target.value,
              })
            }
            className="w-full rounded border border-[#3c5e87]/50 bg-[#1a2f42] px-3 py-2 text-sm text-[#dfe7ef] focus:outline-none focus:ring-1 focus:ring-[#58c1d8]"
          />
        </div>
      </FilterSection>

      <button
        onClick={onClearFilters}
        className="w-full rounded bg-[#3c5e87] py-2 text-sm text-[#dfe7ef] transition-colors hover:bg-[#496a94]"
      >
        Clear All Filters
      </button>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#dfe7ef]">
        {title}
      </label>
      {children}
    </div>
  );
}

function TagList({
  items,
}: {
  items: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }>;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={item.onRemove}
          className="flex cursor-pointer items-center gap-1.5 rounded bg-[#58c1d8]/20 px-2 py-1 text-xs text-[#58c1d8] transition-colors hover:bg-[#58c1d8]/30"
        >
          {item.label}
          <X size={12} />
        </button>
      ))}
    </div>
  );
}

function AdjustDrawer() {
  return (
    <div className="h-full space-y-6 overflow-y-auto p-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[#dfe7ef]">
          Projection
        </label>
        <select className="w-full rounded border border-[#3c5e87]/50 bg-[#1a2f42] px-3 py-2 text-sm text-[#dfe7ef] focus:outline-none focus:ring-1 focus:ring-[#58c1d8]">
          <option>Mercator</option>
          <option>Robinson</option>
          <option>Equal Earth</option>
          <option>Natural Earth</option>
        </select>
      </div>

      <RangeRow label="Rotation Lambda (Longitude)" />
      <RangeRow label="Rotation Phi (Latitude)" min="-90" max="90" />
      <RangeRow label="Rotation Gamma (Roll)" />

      <div className="rounded bg-[#1a2f42] p-3 text-xs text-[#8ba3b8]">
        Note: For display only. Map projection transforms are
        currently still in development.
      </div>
    </div>
  );
}

function RangeRow({
  label,
  min = "-180",
  max = "180",
}: {
  label: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#dfe7ef]">
        {label}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        defaultValue="0"
        className="w-full"
      />
    </div>
  );
}
