/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Composes the top-level dashboard layout and coordinates the shared
 * reducer-driven state while loading article data from the PostgreSQL API
 * instead of processing the full corpus in the browser.
 */

import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { Sparkles } from "lucide-react";
import { UtilityBar } from "@/features/accessibility/UtilityBar";
import {
  fetchArticlePage,
  fetchDashboardBootstrap,
  fetchDashboardSummary,
  type DashboardQueryFilters,
} from "@/features/dashboard/api/dashboardApi";
import { dashboardReducer } from "@/features/dashboard/state/dashboardReducer";
import {
  initialDashboardState,
} from "@/features/dashboard/state/dashboardState";
import { Navbar } from "@/features/layout/Navbar";
import { ResponsiveLeftPanel } from "@/features/layout/ResponsiveLeftPanel";
import { TimelineControl } from "@/features/timeline/TimelineControl";
import type {
  Article,
  DashboardBootstrap,
  DashboardSummary,
} from "@/shared/types";

const WorldMap = lazy(() =>
  import("@/features/map/WorldMap").then((module) => ({
    default: module.WorldMap,
  })),
);

const EnhancedTrendsChart = lazy(() =>
  import("@/features/trends/EnhancedTrendsChart").then((module) => ({
    default: module.EnhancedTrendsChart,
  })),
);

const AIInsightsPanel = lazy(() =>
  import("@/features/insights/AIInsightsPanel").then((module) => ({
    default: module.AIInsightsPanel,
  })),
);

const ArticleModal = lazy(() =>
  import("@/features/articles/ArticleModal").then((module) => ({
    default: module.ArticleModal,
  })),
);

const ARTICLE_PAGE_SIZE = 40;

interface ArticleFeedState {
  items: Article[];
  nextCursor: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

const initialArticleFeedState: ArticleFeedState = {
  items: [],
  nextCursor: null,
  isLoading: true,
  isLoadingMore: false,
  error: null,
};

export function DashboardApp() {
  const [state, dispatch] = useReducer(
    dashboardReducer,
    initialDashboardState,
  );
  const [bootstrap, setBootstrap] =
    useState<DashboardBootstrap | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(
    null,
  );
  const [articleFeed, setArticleFeed] = useState<ArticleFeedState>(
    initialArticleFeedState,
  );
  const [bootstrapError, setBootstrapError] = useState<string | null>(
    null,
  );
  const [summaryError, setSummaryError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (window.innerWidth >= 1440) {
      dispatch({
        type: "set-ai-panel-open",
        isOpen: true,
      });
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    void fetchDashboardBootstrap(abortController.signal)
      .then((response) => {
        setBootstrap(response);
        setBootstrapError(null);
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setBootstrapError(
          error instanceof Error
            ? error.message
            : "Bootstrap query failed.",
        );
      });

    return () => abortController.abort();
  }, []);

  const queryFilters = useMemo<DashboardQueryFilters>(
    () => ({
      searchQuery: state.searchQuery,
      selectedTopics: state.selectedTopics,
      selectedCountries: state.selectedCountries,
      dateRange: state.dateRange,
      granularity: state.granularity,
      selectedPeriod: state.selectedPeriod,
    }),
    [
      state.dateRange,
      state.granularity,
      state.searchQuery,
      state.selectedCountries,
      state.selectedPeriod,
      state.selectedTopics,
    ],
  );

  useEffect(() => {
    const abortController = new AbortController();

    setSummaryError(null);
    setArticleFeed({
      ...initialArticleFeedState,
      isLoading: true,
    });

    void Promise.all([
      fetchDashboardSummary(queryFilters, abortController.signal),
      fetchArticlePage(
        queryFilters,
        null,
        ARTICLE_PAGE_SIZE,
        abortController.signal,
      ),
    ])
      .then(([summaryResponse, articleResponse]) => {
        setSummary(summaryResponse);
        setArticleFeed({
          items: articleResponse.items,
          nextCursor: articleResponse.nextCursor,
          isLoading: false,
          isLoadingMore: false,
          error: null,
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Article query failed.";

        setSummary(null);
        setSummaryError(message);
        setArticleFeed({
          ...initialArticleFeedState,
          items: [],
          isLoading: false,
          error: message,
        });
      });

    return () => abortController.abort();
  }, [queryFilters]);

  const loadMoreArticles = useCallback(async () => {
    if (
      articleFeed.isLoading ||
      articleFeed.isLoadingMore ||
      !articleFeed.nextCursor
    ) {
      return;
    }

    setArticleFeed((current) => ({
      ...current,
      isLoadingMore: true,
      error: null,
    }));

    try {
      const nextPage = await fetchArticlePage(
        queryFilters,
        articleFeed.nextCursor,
        ARTICLE_PAGE_SIZE,
      );

      setArticleFeed((current) => ({
        items: [...current.items, ...nextPage.items],
        nextCursor: nextPage.nextCursor,
        isLoading: false,
        isLoadingMore: false,
        error: null,
      }));
    } catch (error) {
      setArticleFeed((current) => ({
        ...current,
        isLoadingMore: false,
        error:
          error instanceof Error
            ? error.message
            : "Article pagination failed.",
      }));
    }
  }, [
    articleFeed.isLoading,
    articleFeed.isLoadingMore,
    articleFeed.nextCursor,
    queryFilters,
  ]);

  const accessibilityClasses = [
    state.accessibility.highContrast && "a11y-contrast",
    state.accessibility.increaseLineHeight && "a11y-lineheight",
    state.accessibility.increaseTargetSize && "a11y-targets",
  ]
    .filter(Boolean)
    .join(" ");

  const availableTopics = bootstrap?.availableTopics ?? [];
  const availableCountries = bootstrap?.availableCountries ?? [];
  const filteredArticleCount = summary?.filteredArticleCount ?? 0;
  const totalArticleCount = bootstrap?.totalArticleCount ?? 0;
  const countryCounts = summary?.countryCounts ?? {};
  const aiInsights = summary?.aiInsights ?? null;
  const timelineDates = bootstrap
    ? [bootstrap.dateBounds.start, bootstrap.dateBounds.end]
    : [state.dateRange.start, state.dateRange.end];
  const dataError = bootstrapError ?? summaryError ?? articleFeed.error;

  return (
    <div
      className={`relative flex h-screen w-screen flex-col overflow-hidden bg-[#0b1c2c] ${accessibilityClasses}`}
      data-font={state.accessibility.fontSize}
    >
      <UtilityBar
        fontSize={state.accessibility.fontSize}
        highContrast={state.accessibility.highContrast}
        increaseLineHeight={
          state.accessibility.increaseLineHeight
        }
        increaseTargetSize={
          state.accessibility.increaseTargetSize
        }
        onFontSizeChange={(fontSize) =>
          dispatch({ type: "set-font-size", fontSize })
        }
        onHighContrastToggle={() =>
          dispatch({ type: "toggle-high-contrast" })
        }
        onLineHeightToggle={() =>
          dispatch({ type: "toggle-line-height" })
        }
        onTargetSizeToggle={() =>
          dispatch({ type: "toggle-target-size" })
        }
      />

      <Navbar
        activeView={state.activeView}
        searchQuery={state.searchQuery}
        onViewChange={(view) =>
          dispatch({ type: "set-view", view })
        }
        onSearchChange={(query) =>
          dispatch({ type: "set-search-query", query })
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <ResponsiveLeftPanel
          activeDrawer={state.activeDrawer}
          articles={articleFeed.items}
          articleTotalCount={filteredArticleCount}
          articlesLoading={articleFeed.isLoading}
          articlesLoadingMore={articleFeed.isLoadingMore}
          hasMoreArticles={Boolean(articleFeed.nextCursor)}
          availableTopics={availableTopics}
          selectedTopics={state.selectedTopics}
          availableCountries={availableCountries}
          dateRange={state.dateRange}
          selectedCountries={state.selectedCountries}
          searchQuery={state.searchQuery}
          selectedPeriod={state.selectedPeriod}
          onDrawerChange={(drawer) =>
            dispatch({ type: "set-drawer", drawer })
          }
          onTopicToggle={(topic) =>
            dispatch({ type: "toggle-topic", topic })
          }
          onDateRangeChange={(range) =>
            dispatch({ type: "set-date-range", range })
          }
          onCountryToggle={(countryCode) =>
            dispatch({ type: "toggle-country", countryCode })
          }
          onClearFilters={() =>
            dispatch({ type: "clear-filters" })
          }
          onArticleClick={(article) =>
            dispatch({ type: "open-article", article })
          }
          onSearchChange={(query) =>
            dispatch({ type: "set-search-query", query })
          }
          onPeriodChange={(period) =>
            dispatch({ type: "set-selected-period", period })
          }
          onLoadMoreArticles={loadMoreArticles}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <section className="flex flex-1 flex-col overflow-hidden">
              <div className="relative flex-1 overflow-hidden">
                <Suspense
                  fallback={
                    <div className="h-full w-full bg-[#0d1f2f]" />
                  }
                >
                  {state.activeView === "news" ? (
                    <WorldMap
                      selectedCountries={state.selectedCountries}
                      countryData={countryCounts}
                      hoveredCountry={state.hoveredCountry}
                      onCountryClick={(countryCode) =>
                        dispatch({
                          type: "toggle-country",
                          countryCode,
                        })
                      }
                      onCountryHover={(countryCode) =>
                        dispatch({
                          type: "set-hovered-country",
                          countryCode,
                        })
                      }
                      onClearCountries={() =>
                        dispatch({ type: "clear-countries" })
                      }
                    />
                  ) : (
                    <EnhancedTrendsChart
                      selectedCountries={state.selectedCountries}
                      granularity={state.granularity}
                      dateRange={state.dateRange}
                      selectedTopics={state.selectedTopics}
                      selectedPeriod={state.selectedPeriod}
                      searchQuery={state.searchQuery}
                      onPeriodClick={(period) =>
                        dispatch({
                          type: "set-selected-period",
                          period,
                        })
                      }
                    />
                  )}
                </Suspense>

                {!state.aiPanelOpen ? (
                  <button
                    onClick={() =>
                      dispatch({
                        type: "set-ai-panel-open",
                        isOpen: true,
                      })
                    }
                    className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-[#58c1d8] px-4 py-2 text-[#0b1c2c] shadow-lg transition-colors hover:bg-[#7dd3f0]"
                  >
                    <Sparkles size={18} />
                    <span className="font-medium">AI Insights</span>
                  </button>
                ) : null}

                {dataError ? (
                  <div className="absolute bottom-4 left-4 z-10 max-w-md rounded border border-[#ef5350]/30 bg-[#1a2f42] px-4 py-3 text-sm text-[#dfe7ef] shadow-lg">
                    {dataError}
                  </div>
                ) : null}
              </div>

              <TimelineControl
                dateRange={state.dateRange}
                granularity={state.granularity}
                allDates={timelineDates}
                onDateRangeChange={(range) =>
                  dispatch({ type: "set-date-range", range })
                }
                onGranularityChange={(granularity) =>
                  dispatch({
                    type: "set-granularity",
                    granularity,
                  })
                }
              />

              <div className="hidden h-6 flex-shrink-0 items-center justify-between border-t border-[#3c5e87]/30 bg-[#1a2f42] px-4 md:flex">
                <div className="text-xs text-[#8ba3b8]">
                  {filteredArticleCount} of {totalArticleCount} articles
                  {state.selectedTopics.length > 0
                    ? ` | ${state.selectedTopics.join(", ")}`
                    : ""}
                  {state.selectedCountries.length > 0
                    ? ` | ${state.selectedCountries.length} countries`
                    : ""}
                  {state.searchQuery ? " | Search active" : ""}
                </div>
                <div className="text-xs text-[#8ba3b8]">
                  {state.granularity.charAt(0).toUpperCase() +
                    state.granularity.slice(1)}{" "}
                  | {state.dateRange.start} to {state.dateRange.end}
                </div>
              </div>
            </section>

            {state.aiPanelOpen ? (
              <Suspense
                fallback={
                  <div className="hidden border-l border-[#3c5e87]/30 bg-[#0b1c2c] md:block md:w-96" />
                }
              >
                <AIInsightsPanel
                  isOpen={state.aiPanelOpen}
                  insights={aiInsights}
                  onClose={() =>
                    dispatch({
                      type: "set-ai-panel-open",
                      isOpen: false,
                    })
                  }
                />
              </Suspense>
            ) : null}
          </div>
        </main>
      </div>

      {state.articleModalOpen ? (
        <Suspense fallback={null}>
          <ArticleModal
            article={state.selectedArticle}
            isOpen={state.articleModalOpen}
            onClose={() => dispatch({ type: "close-article" })}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
