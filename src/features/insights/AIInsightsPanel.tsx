/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Presents the right-side AI insights panel that summarizes the
 * current filtered dataset without introducing new product concepts.
 */

import {
  BarChart3,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import type { AIInsights } from "@/shared/types";

interface AIInsightsPanelProps {
  isOpen: boolean;
  insights: AIInsights | null;
  onClose: () => void;
}

export function AIInsightsPanel({
  isOpen,
  insights,
  onClose,
}: AIInsightsPanelProps) {
  if (!isOpen || !insights) {
    return null;
  }

  const totalSentiment =
    insights.sentimentSummary.positiveCount +
    insights.sentimentSummary.neutralCount +
    insights.sentimentSummary.negativeCount;

  return (
    <div className="fixed inset-0 z-40 flex flex-col border-l border-[#3c5e87]/30 bg-[#0b1c2c] md:relative md:inset-auto md:w-96">
      <div className="flex h-14 items-center justify-between border-b border-[#3c5e87]/30 px-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-[#58c1d8]" />
          <h3 className="text-base font-medium text-[#dfe7ef]">
            AI Insights
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-[#8ba3b8] transition-colors hover:text-[#dfe7ef]"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div>
          <h4 className="mb-2 text-sm font-medium text-[#dfe7ef]">
            Summary
          </h4>
          <p className="text-sm leading-relaxed text-[#8ba3b8]">
            {insights.summaryText}
          </p>
          <div className="mt-2 text-xs text-[#8ba3b8]">
            {insights.dateRange.start} to {insights.dateRange.end}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-[#58c1d8]" />
            <h4 className="text-sm font-medium text-[#dfe7ef]">
              Sentiment Distribution
            </h4>
          </div>
          <div className="space-y-2">
            <SentimentRow
              label="Positive"
              count={insights.sentimentSummary.positiveCount}
              total={totalSentiment}
              fillClassName="bg-green-500"
              textClassName="text-green-400"
            />
            <SentimentRow
              label="Neutral"
              count={insights.sentimentSummary.neutralCount}
              total={totalSentiment}
              fillClassName="bg-gray-500"
              textClassName="text-gray-400"
            />
            <SentimentRow
              label="Negative"
              count={insights.sentimentSummary.negativeCount}
              total={totalSentiment}
              fillClassName="bg-red-500"
              textClassName="text-red-400"
            />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Target size={16} className="text-[#58c1d8]" />
            <h4 className="text-sm font-medium text-[#dfe7ef]">
              Top Topics
            </h4>
          </div>
          <div className="space-y-2">
            {insights.topTopics.slice(0, 5).map((topic) => (
              <div
                key={topic.label}
                className="flex items-center justify-between rounded bg-[#1a2f42] p-2"
              >
                <span className="text-sm text-[#dfe7ef]">
                  {topic.label}
                </span>
                <span className="text-xs font-medium text-[#58c1d8]">
                  {topic.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-medium text-[#dfe7ef]">
            Popular Keywords
          </h4>
          <div className="space-y-2">
            {insights.entityFrequency.slice(0, 8).map((entity) => (
              <div
                key={entity.entity}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-[#8ba3b8]">
                  {entity.entity}
                </span>
                <span className="text-xs text-[#dfe7ef]">
                  {entity.frequency}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SentimentRow({
  label,
  count,
  total,
  fillClassName,
  textClassName,
}: {
  label: string;
  count: number;
  total: number;
  fillClassName: string;
  textClassName: string;
}) {
  const width = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className={textClassName}>{label}</span>
        <span className="text-[#dfe7ef]">{count}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded bg-[#1a2f42]">
        <div
          className={`h-full ${fillClassName}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
