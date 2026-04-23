/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Renders the primary navigation header, view toggle, and responsive
 * search controls for the dashboard shell.
 */

import { useState } from "react";
import { Search } from "lucide-react";
import type { DashboardView } from "@/shared/types";

interface NavbarProps {
  activeView: DashboardView;
  searchQuery: string;
  onViewChange: (view: DashboardView) => void;
  onSearchChange: (query: string) => void;
}

export function Navbar({
  activeView,
  searchQuery,
  onViewChange,
  onSearchChange,
}: NavbarProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);

  return (
    <div className="flex h-14 items-center justify-between border-b border-[#3c5e87]/30 bg-[#1a2f42] px-3 md:h-16 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-8">
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#58c1d8] md:h-8 md:w-8">
            <div className="h-3 w-3 rounded-full border-2 border-[#0b1c2c] md:h-4 md:w-4" />
          </div>
          <h1 className="hidden text-base font-medium text-[#dfe7ef] sm:block md:text-lg">
            Anchored News
          </h1>
          <h1 className="text-base font-medium text-[#dfe7ef] sm:hidden">
            AN
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <ViewButton
            label="Map"
            isActive={activeView === "news"}
            onClick={() => onViewChange("news")}
          />
          <ViewButton
            label="Trends"
            isActive={activeView === "trends"}
            onClick={() => onViewChange("trends")}
          />
        </div>
      </div>

      <div className="hidden w-80 items-center gap-2 rounded-lg bg-[#0b1c2c] px-3 py-2 md:flex">
        <Search size={16} className="text-[#8ba3b8]" />
        <input
          type="text"
          placeholder="Search articles, topics, keywords..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="flex-1 bg-transparent text-sm text-[#dfe7ef] outline-none placeholder:text-[#8ba3b8]"
        />
      </div>

      <button
        onClick={() => setSearchExpanded((value) => !value)}
        className="p-2 text-[#8ba3b8] hover:text-[#dfe7ef] md:hidden"
      >
        <Search size={18} />
      </button>

      {searchExpanded ? (
        <div className="absolute left-0 right-0 top-14 z-50 border-b border-[#3c5e87]/30 bg-[#1a2f42] p-3 md:hidden">
          <div className="flex items-center gap-2 rounded-lg bg-[#0b1c2c] px-3 py-2">
            <Search size={16} className="text-[#8ba3b8]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(event) =>
                onSearchChange(event.target.value)
              }
              className="flex-1 bg-transparent text-sm text-[#dfe7ef] outline-none placeholder:text-[#8ba3b8]"
              autoFocus
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ViewButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1.5 text-sm transition-colors md:px-4 md:py-2 ${
        isActive
          ? "bg-[#3c5e87] text-[#dfe7ef]"
          : "text-[#8ba3b8] hover:bg-[#2a3f54] hover:text-[#dfe7ef]"
      }`}
    >
      {label}
    </button>
  );
}
