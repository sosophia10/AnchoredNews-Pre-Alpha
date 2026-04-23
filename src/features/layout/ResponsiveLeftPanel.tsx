/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Wraps the left panel in the desktop and mobile behaviors used by
 * the exported dashboard so drawers stay consistent across breakpoints.
 */

import { useEffect, useState } from "react";
import { LeftPanel } from "@/features/filters/LeftPanel";
import type {
  Article,
  AvailableCountry,
  DashboardDrawer,
  DateRange,
} from "@/shared/types";

interface ResponsiveLeftPanelProps {
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

export function ResponsiveLeftPanel(
  props: ResponsiveLeftPanelProps,
) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () =>
      window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile && props.activeDrawer) {
    return (
      <div className="fixed inset-0 z-40 flex bg-[#0b1c2c]">
        <LeftPanel {...props} />
      </div>
    );
  }

  return <LeftPanel {...props} />;
}
