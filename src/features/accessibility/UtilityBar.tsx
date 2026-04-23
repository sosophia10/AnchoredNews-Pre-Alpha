/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Provides the top utility bar and wires its accessibility controls
 * to the shared dashboard state without changing visible product behavior.
 */

import { useEffect, useRef, useState } from "react";
import {
  Accessibility,
  Moon,
  RefreshCw,
} from "lucide-react";
import type { FontSize } from "@/shared/types";
import { AccessibilityPanel } from "./AccessibilityPanel";

interface UtilityBarProps {
  fontSize: FontSize;
  highContrast: boolean;
  increaseLineHeight: boolean;
  increaseTargetSize: boolean;
  onFontSizeChange: (size: FontSize) => void;
  onHighContrastToggle: () => void;
  onLineHeightToggle: () => void;
  onTargetSizeToggle: () => void;
}

export function UtilityBar({
  fontSize,
  highContrast,
  increaseLineHeight,
  increaseTargetSize,
  onFontSizeChange,
  onHighContrastToggle,
  onLineHeightToggle,
  onTargetSizeToggle,
}: UtilityBarProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelNode, setPanelNode] =
    useState<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isPanelOpen &&
        panelNode &&
        buttonRef.current &&
        !panelNode.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPanelOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, [isPanelOpen]);

  const isAccessibilityActive =
    fontSize !== "default" ||
    highContrast ||
    increaseLineHeight ||
    increaseTargetSize;

  return (
    <div className="flex h-10 items-center justify-between border-b border-[#3c5e87]/30 bg-[#1a2f42] px-4">
      <div className="flex items-center gap-4">
        <select className="rounded border border-[#3c5e87]/50 bg-[#0b1c2c] px-2 py-1 text-xs text-[#dfe7ef] focus:outline-none focus:ring-1 focus:ring-[#58c1d8]">
          <option>English</option>
          <option>Espanol</option>
          <option>Francais</option>
          <option>Deutsch</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="p-1 text-[#8ba3b8] transition-colors hover:text-[#58c1d8]"
          title="Refresh data"
        >
          <RefreshCw size={14} />
        </button>
        <button
          className="p-1 text-[#8ba3b8] transition-colors hover:text-[#58c1d8]"
          title="Theme (placeholder)"
        >
          <Moon size={14} />
        </button>
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsPanelOpen((value) => !value)}
            className={`p-1 transition-colors ${
              isAccessibilityActive || isPanelOpen
                ? "text-[#58c1d8]"
                : "text-[#8ba3b8] hover:text-[#58c1d8]"
            }`}
            title="Accessibility"
          >
            <Accessibility size={14} />
          </button>
          <AccessibilityPanel
            isOpen={isPanelOpen}
            fontSize={fontSize}
            highContrast={highContrast}
            increaseLineHeight={increaseLineHeight}
            increaseTargetSize={increaseTargetSize}
            onFontSizeChange={onFontSizeChange}
            onHighContrastToggle={onHighContrastToggle}
            onLineHeightToggle={onLineHeightToggle}
            onTargetSizeToggle={onTargetSizeToggle}
            setPanelRef={setPanelNode}
          />
        </div>
      </div>
    </div>
  );
}
