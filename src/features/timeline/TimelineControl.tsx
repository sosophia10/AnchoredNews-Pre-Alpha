/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Provides the shared timeline interaction model for both views,
 * including range dragging, merged-handle behavior, and granularity changes.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { Calendar } from "lucide-react";
import type { Granularity } from "@/shared/types";

interface TimelineControlProps {
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: {
    start: string;
    end: string;
  }) => void;
  granularity: Granularity;
  onGranularityChange: (granularity: Granularity) => void;
  allDates: string[];
}

type DragTarget = "start" | "end" | "both" | null;

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year!, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0);
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date: string): string {
  const value = new Date(date);
  return `${value.getMonth() + 1}/${value.getDate()}/${value.getFullYear()}`;
}

export function TimelineControl({
  dateRange,
  onDateRangeChange,
  granularity,
  onGranularityChange,
  allDates,
}: TimelineControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<DragTarget>(null);
  const [isMerged, setIsMerged] = useState(false);

  const sortedDates = useMemo(() => [...allDates].sort(), [allDates]);
  // The SQL bootstrap returns the true data bounds, but the exported UI also
  // allows the reducer to hold slightly wider preset dates. Keep the active
  // range inside the visible rail so the timeline never clips a valid handle.
  const minDate =
    [sortedDates[0], dateRange.start].filter(Boolean).sort()[0] ??
    dateRange.start;
  const maxDate =
    [sortedDates[sortedDates.length - 1], dateRange.end]
      .filter(Boolean)
      .sort()
      .at(-1) ?? dateRange.end;

  const dateToPosition = (date: string) => {
    const total =
      parseLocalDate(maxDate).getTime() -
      parseLocalDate(minDate).getTime();
    const current =
      parseLocalDate(date).getTime() -
      parseLocalDate(minDate).getTime();

    return total > 0 ? current / total : 0;
  };

  const positionToDate = (position: number) => {
    const total =
      parseLocalDate(maxDate).getTime() -
      parseLocalDate(minDate).getTime();
    const timestamp =
      parseLocalDate(minDate).getTime() + total * position;

    return formatLocalDate(new Date(timestamp));
  };

  const startPos = dateToPosition(dateRange.start);
  const endPos = dateToPosition(dateRange.end);

  useEffect(() => {
    // When the handles get close enough, the UI switches to the merged marker
    // state to preserve the original exported interaction model.
    setIsMerged(Math.abs(endPos - startPos) < 0.03);
  }, [endPos, startPos]);

  const handlePointerDown =
    (target: Exclude<DragTarget, null>) =>
    (
      event: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    ) => {
      event.preventDefault();
      setIsDragging(target);
    };

  useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    const handleMove = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const clientX =
        "touches" in event
          ? event.touches[0]?.clientX ?? rect.left
          : event.clientX;
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const position = rect.width > 0 ? x / rect.width : 0;
      const nextDate = positionToDate(position);

      if (isDragging === "start") {
        onDateRangeChange({
          start: nextDate,
          end: dateRange.end,
        });
        return;
      }

      if (isDragging === "end") {
        onDateRangeChange({
          start: dateRange.start,
          end: nextDate,
        });
        return;
      }

      const rangeWidth = endPos - startPos;
      const currentCenter = (startPos + endPos) / 2;
      const offset = position - currentCenter;

      let nextStartPos = startPos + offset;
      let nextEndPos = endPos + offset;

      if (nextStartPos < 0) {
        nextStartPos = 0;
        nextEndPos = rangeWidth;
      } else if (nextEndPos > 1) {
        nextEndPos = 1;
        nextStartPos = 1 - rangeWidth;
      }

      onDateRangeChange({
        start: positionToDate(nextStartPos),
        end: positionToDate(nextEndPos),
      });
    };

    const handleUp = () => {
      setIsDragging(null);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleUp);
    };
  }, [
    dateRange.end,
    dateRange.start,
    endPos,
    isDragging,
    onDateRangeChange,
    startPos,
  ]);

  const handleSplit = () => {
    if (!isMerged) {
      return;
    }

    const totalTime =
      parseLocalDate(maxDate).getTime() -
      parseLocalDate(minDate).getTime();
    const offsetTime = totalTime * 0.05;
    const centerTime =
      (parseLocalDate(dateRange.start).getTime() +
        parseLocalDate(dateRange.end).getTime()) /
      2;

    onDateRangeChange({
      start: formatLocalDate(
        new Date(
          Math.max(
            centerTime - offsetTime,
            parseLocalDate(minDate).getTime(),
          ),
        ),
      ),
      end: formatLocalDate(
        new Date(
          Math.min(
            centerTime + offsetTime,
            parseLocalDate(maxDate).getTime(),
          ),
        ),
      ),
    });
  };

  const tickMarks = useMemo(() => {
    const ticks: Array<{
      position: number;
      label?: string;
      isMajor: boolean;
      date: string;
    }> = [];

    const startTime = parseLocalDate(minDate).getTime();
    const endTime = parseLocalDate(maxDate).getTime();
    const totalTime = endTime - startTime;

    if (totalTime <= 0) {
      return ticks;
    }

    const minLabelSpacing = 0.05;

    if (granularity === "daily") {
      // Daily mode intentionally labels only major ticks so the dense dataset
      // stays readable on laptop widths while still supporting precise dragging.
      const currentDate = parseLocalDate(minDate);
      let dayCount = 0;
      let lastLabelPos = -1;

      while (currentDate.getTime() <= endTime) {
        const position =
          (currentDate.getTime() - startTime) / totalTime;
        const isMajor = dayCount % 7 === 0;
        const showLabel =
          isMajor &&
          (lastLabelPos < 0 ||
            position - lastLabelPos >= minLabelSpacing);

        if (showLabel) {
          lastLabelPos = position;
        }

        const labelDate = new Date(currentDate);
        labelDate.setDate(labelDate.getDate() - 1);

        ticks.push({
          position,
          label: showLabel
            ? labelDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : undefined,
          isMajor,
          date: formatLocalDate(currentDate),
        });

        currentDate.setDate(currentDate.getDate() + 1);
        dayCount += 1;
      }
    } else if (granularity === "weekly") {
      const currentDate = parseLocalDate(minDate);
      const dayOfWeek = currentDate.getDay();
      const daysUntilMonday =
        dayOfWeek === 1 ? 0 : dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

      currentDate.setDate(currentDate.getDate() + daysUntilMonday);

      let lastLabelPos = -1;

      while (currentDate.getTime() <= endTime) {
        const position =
          (currentDate.getTime() - startTime) / totalTime;
        const showLabel =
          lastLabelPos < 0 ||
          position - lastLabelPos >= minLabelSpacing;

        if (showLabel) {
          lastLabelPos = position;
        }

        const labelDate = new Date(currentDate);
        labelDate.setDate(labelDate.getDate() - 1);

        ticks.push({
          position,
          label: showLabel
            ? labelDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : undefined,
          isMajor: true,
          date: formatLocalDate(currentDate),
        });

        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else {
      const currentDate = parseLocalDate(minDate);
      currentDate.setDate(1);

      if (currentDate.getTime() < startTime) {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      while (currentDate.getTime() <= endTime) {
        const position =
          (currentDate.getTime() - startTime) / totalTime;
        const labelDate = new Date(currentDate);
        labelDate.setDate(labelDate.getDate() - 1);

        ticks.push({
          position,
          label: labelDate.toLocaleDateString("en-US", {
            month: "short",
          }),
          isMajor: true,
          date: formatLocalDate(currentDate),
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    return ticks;
  }, [granularity, maxDate, minDate]);

  return (
    <div className="flex-shrink-0 border-t border-[#3c5e87]/50 bg-[#1a2f42]/95 shadow-lg backdrop-blur-sm">
      <div className="mx-auto max-w-[2000px] px-4 py-2 md:px-6 md:py-3">
        <div className="mb-1.5 flex items-center justify-between md:mb-2">
          <div className="flex items-center gap-2">
            <Calendar
              size={14}
              className="text-[#58c1d8] md:h-4 md:w-4"
            />
            <span className="text-xs font-medium text-[#dfe7ef] md:text-sm">
              Timeline
            </span>
          </div>

          <div className="flex items-center gap-0.5 rounded-lg bg-[#0d1f2f] p-0.5 md:gap-1 md:p-1">
            {(["daily", "weekly", "monthly"] as const).map(
              (value) => (
                <button
                  key={value}
                  onClick={() => onGranularityChange(value)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors md:px-3 md:py-1 ${
                    granularity === value
                      ? "bg-[#58c1d8] text-[#0b1c2c]"
                      : "text-[#8ba3b8] hover:text-[#dfe7ef]"
                  }`}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="relative">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] text-[#8ba3b8] md:text-xs">
            <span className="hidden flex-shrink-0 sm:inline">
              {formatDate(minDate)}
            </span>
            <span className="flex-shrink-0 text-center text-[10px] font-medium text-[#dfe7ef] md:text-xs">
              {formatDate(dateRange.start)} {"->"} {formatDate(dateRange.end)}
            </span>
            <span className="hidden flex-shrink-0 sm:inline">
              {formatDate(maxDate)}
            </span>
          </div>

          <div className="relative pb-4 md:pb-5">
            <div
              ref={containerRef}
              className={`relative h-6 rounded-lg bg-[#0d1f2f] transition-shadow md:h-8 ${
                isDragging
                  ? "cursor-grabbing ring-2 ring-[#58c1d8]/50"
                  : "cursor-pointer"
              }`}
              style={{ userSelect: "none" }}
            >
              <div className="pointer-events-none absolute inset-0 flex items-end px-0">
                {tickMarks.map((tick, index) => (
                  <div
                    key={`${tick.date}-${index}`}
                    className="absolute"
                    style={{ left: `${tick.position * 100}%` }}
                  >
                    <div
                      className={`transition-all ${
                        tick.isMajor
                          ? "h-4 w-0.5 bg-[#58c1d8] md:h-5"
                          : "h-2 w-px bg-[#8ba3b8] md:h-3"
                      }`}
                      style={{ opacity: tick.isMajor ? 0.8 : 0.4 }}
                    />
                    {tick.label ? (
                      <div className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium text-[#8ba3b8] md:text-[10px]">
                        {tick.label}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div
                className={`absolute top-0 bottom-0 cursor-move border-y border-[#58c1d8] bg-[#58c1d8]/20 transition-opacity hover:bg-[#58c1d8]/30 ${
                  isDragging === "both"
                    ? "bg-[#58c1d8]/30 opacity-100"
                    : "opacity-70"
                }`}
                style={{
                  left: `${Math.min(startPos, endPos) * 100}%`,
                  width: `${Math.abs(endPos - startPos) * 100}%`,
                  pointerEvents: isMerged ? "none" : "auto",
                }}
                onMouseDown={
                  !isMerged ? handlePointerDown("both") : undefined
                }
                onTouchStart={
                  !isMerged ? handlePointerDown("both") : undefined
                }
                title="Drag to move range"
              />

              {!isMerged ? (
                <div
                  className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none"
                  style={{ left: `${startPos * 100}%` }}
                  onMouseDown={handlePointerDown("start")}
                  onTouchStart={handlePointerDown("start")}
                  role="slider"
                  aria-label="Start date"
                  tabIndex={0}
                >
                  <div className="h-6 w-6 rounded-full border-2 border-[#0b1c2c] bg-[#58c1d8] shadow-lg shadow-[#58c1d8]/40 transition-all group-hover:scale-110 group-hover:shadow-[#58c1d8]/60 group-focus:scale-110 group-focus:ring-2 group-focus:ring-[#58c1d8] md:h-5 md:w-5" />
                </div>
              ) : null}

              {!isMerged ? (
                <div
                  className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none"
                  style={{ left: `${endPos * 100}%` }}
                  onMouseDown={handlePointerDown("end")}
                  onTouchStart={handlePointerDown("end")}
                  role="slider"
                  aria-label="End date"
                  tabIndex={0}
                >
                  <div className="h-6 w-6 rounded-full border-2 border-[#0b1c2c] bg-[#58c1d8] shadow-lg shadow-[#58c1d8]/40 transition-all group-hover:scale-110 group-hover:shadow-[#58c1d8]/60 group-focus:scale-110 group-focus:ring-2 group-focus:ring-[#58c1d8] md:h-5 md:w-5" />
                </div>
              ) : null}

              {isMerged ? (
                <div
                  className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-move touch-none"
                  style={{
                    left: `${((startPos + endPos) / 2) * 100}%`,
                  }}
                  onMouseDown={handlePointerDown("both")}
                  onTouchStart={handlePointerDown("both")}
                  onClick={handleSplit}
                >
                  <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0b1c2c] bg-[#58c1d8] shadow-lg shadow-[#58c1d8]/40 transition-all group-hover:scale-110 group-hover:shadow-[#58c1d8]/60 md:h-7 md:w-7">
                      <div className="h-3 w-px bg-[#0b1c2c] md:h-4" />
                    </div>
                    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0b1c2c] px-2 py-1 text-xs text-[#dfe7ef] opacity-0 transition-opacity group-hover:opacity-100">
                      Click to split
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
