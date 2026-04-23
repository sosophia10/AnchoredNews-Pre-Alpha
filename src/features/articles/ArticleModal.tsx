/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Displays the article detail modal that preserves the exported
 * reading experience for titles, metadata, keywords, entities, and source links.
 */

import type { ReactNode } from "react";
import {
  Calendar,
  ExternalLink,
  MapPin,
  TrendingUp,
  X,
} from "lucide-react";
import type { Article } from "@/shared/types";

interface ArticleModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArticleModal({
  article,
  isOpen,
  onClose,
}: ArticleModalProps) {
  if (!isOpen || !article) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[#3c5e87] bg-[#1a2f42]">
        <div className="flex items-start justify-between border-b border-[#3c5e87]/30 p-6">
          <div className="flex-1 pr-4">
            <h2 className="mb-2 text-xl font-medium text-[#dfe7ef]">
              {article.title}
            </h2>
            <div className="flex flex-wrap gap-3 text-sm text-[#8ba3b8]">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{article.publishedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>{article.country}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8ba3b8] transition-colors hover:text-[#dfe7ef]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <Section title="Source">
            <p className="text-sm text-[#8ba3b8]">{article.source}</p>
          </Section>

          <Section title="Sentiment Analysis">
            <div className="flex items-center gap-3">
              <span
                className={`rounded px-3 py-1.5 text-sm font-medium ${
                  article.sentiment === "positive"
                    ? "bg-green-500/20 text-green-400"
                    : article.sentiment === "negative"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {article.sentiment}
              </span>
              <span className="text-sm text-[#8ba3b8]">
                Score: {article.sentimentScore.toFixed(2)}
              </span>
            </div>
          </Section>

          {article.entities.length > 0 ? (
            <Section title="Key Entities">
              <div className="flex flex-wrap gap-2">
                {article.entities.map((entity) => (
                  <span
                    key={entity}
                    className="rounded bg-[#3c5e87]/30 px-3 py-1 text-sm text-[#58c1d8]"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          {article.keywords.length > 0 ? (
            <Section title="Keywords">
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded bg-[#0b1c2c] px-2 py-1 text-xs text-[#8ba3b8]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          <Section title="Topic">
            <div className="flex items-center gap-2">
              <TrendingUp
                size={16}
                className="text-[#58c1d8]"
              />
              <span className="text-sm text-[#dfe7ef]">
                {article.topic}
              </span>
            </div>
          </Section>
        </div>

        <div className="border-t border-[#3c5e87]/30 p-6">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded bg-[#58c1d8] py-2.5 font-medium text-[#0b1c2c] transition-colors hover:bg-[#7dd3f0]"
          >
            <span>Read Full Article</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-[#dfe7ef]">
        {title}
      </h3>
      {children}
    </div>
  );
}
