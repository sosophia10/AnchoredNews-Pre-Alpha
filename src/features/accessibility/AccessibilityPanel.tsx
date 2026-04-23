/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Renders the accessibility settings flyout used by the utility bar
 * so readers can adjust font size, contrast, spacing, and target sizes.
 */

import type { FontSize } from "@/shared/types";

interface AccessibilityPanelProps {
  isOpen: boolean;
  fontSize: FontSize;
  highContrast: boolean;
  increaseLineHeight: boolean;
  increaseTargetSize: boolean;
  onFontSizeChange: (size: FontSize) => void;
  onHighContrastToggle: () => void;
  onLineHeightToggle: () => void;
  onTargetSizeToggle: () => void;
  setPanelRef: (node: HTMLDivElement | null) => void;
}

export function AccessibilityPanel({
  isOpen,
  fontSize,
  highContrast,
  increaseLineHeight,
  increaseTargetSize,
  onFontSizeChange,
  onHighContrastToggle,
  onLineHeightToggle,
  onTargetSizeToggle,
  setPanelRef,
}: AccessibilityPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={setPanelRef}
      className="absolute right-0 top-full z-50 mt-1 w-72 rounded border-2 border-[#3c5e87] bg-[#1a2f42] shadow-xl"
    >
      <div className="p-4">
        <div className="mb-4 border-b border-[#3c5e87]/50 pb-3">
          <h3 className="text-sm font-medium text-[#dfe7ef]">
            Accessibility Settings
          </h3>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-[#8ba3b8]">
            Font Size
          </label>
          <div className="flex gap-1">
            {(["small", "default", "large", "xl"] as const).map(
              (size) => (
                <button
                  key={size}
                  onClick={() => onFontSizeChange(size)}
                  className={`flex-1 rounded px-2 py-1.5 text-xs transition-colors ${
                    fontSize === size
                      ? "bg-[#58c1d8] font-medium text-[#0b1c2c]"
                      : "bg-[#0b1c2c] text-[#8ba3b8] hover:bg-[#3c5e87]/30 hover:text-[#dfe7ef]"
                  }`}
                >
                  {size === "small" && "Small"}
                  {size === "default" && "Default"}
                  {size === "large" && "Large"}
                  {size === "xl" && "XL"}
                </button>
              ),
            )}
          </div>
        </div>

        <ToggleRow
          label="High Contrast"
          checked={highContrast}
          onToggle={onHighContrastToggle}
        />
        <ToggleRow
          label="Increase Line Height"
          checked={increaseLineHeight}
          onToggle={onLineHeightToggle}
        />
        <ToggleRow
          label="Increase Target Size"
          checked={increaseTargetSize}
          onToggle={onTargetSizeToggle}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="flex cursor-pointer items-center justify-between">
        <span className="text-xs text-[#dfe7ef]">{label}</span>
        <button
          onClick={onToggle}
          className={`relative h-5 w-10 rounded-full transition-colors ${
            checked ? "bg-[#58c1d8]" : "bg-[#3c5e87]"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </label>
    </div>
  );
}
