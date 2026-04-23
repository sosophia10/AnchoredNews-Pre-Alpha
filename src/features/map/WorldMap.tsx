/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Renders the preserved SVG world map experience, including country
 * hover/selection, zoom, pan, reset, and the map legend used by the news view.
 */

import type { CSSProperties, ReactNode } from "react";
import { useRef, useState } from "react";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { countryPaths } from "@/data/geo/countryPaths";
import {
  convertIso2ToIso3,
  convertIso3ToIso2,
} from "@/shared/lib/countryCodeMapper";

interface WorldMapProps {
  selectedCountries: string[];
  countryData: Record<string, number>;
  hoveredCountry: string | null;
  onCountryClick: (countryCode: string) => void;
  onCountryHover: (countryCode: string | null) => void;
  onClearCountries: () => void;
}

export function WorldMap({
  selectedCountries,
  countryData,
  hoveredCountry,
  onCountryClick,
  onCountryHover,
  onClearCountries,
}: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const selectedCountriesIso3 = selectedCountries.map(
    convertIso2ToIso3,
  );
  const hoveredCountryIso3 = hoveredCountry
    ? convertIso2ToIso3(hoveredCountry)
    : null;

  // Articles are keyed by ISO2 while the SVG geometry is keyed by ISO3, so the
  // map keeps a converted lookup table for rendering without touching the data.
  const countryDataIso3: Record<string, number> = {};
  for (const [iso2Code, count] of Object.entries(countryData)) {
    countryDataIso3[convertIso2ToIso3(iso2Code)] = count;
  }

  function handleMouseDown(event: React.MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: event.clientX - transform.x,
      y: event.clientY - transform.y,
    });
  }

  function handleMouseMove(event: React.MouseEvent) {
    if (!isDragging) {
      return;
    }

    setTransform((current) => ({
      ...current,
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    }));
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleWheel(event: React.WheelEvent) {
    event.preventDefault();

    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const scale = Math.max(
      0.5,
      Math.min(8, transform.scale * delta),
    );

    setTransform((current) => ({ ...current, scale }));
  }

  function resetView() {
    setTransform({ x: 0, y: 0, scale: 1 });
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#0d1f2f]"
      onDoubleClick={resetView}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1000 600"
        className="h-full w-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transition: isDragging
            ? "none"
            : "transform 0.1s ease-out",
        }}
      >
        <rect width="1000" height="600" fill="#0b1c2c" />

        {Object.entries(countryPaths).map(
          ([iso3Code, { path, name: _name }]) => {
            const isSelected =
              selectedCountriesIso3.includes(iso3Code);
            const isHovered = hoveredCountryIso3 === iso3Code;
            const articleCount = countryDataIso3[iso3Code] ?? 0;

            return (
              <path
                key={iso3Code}
                d={path}
                fill={
                  isSelected
                    ? "#58c1d8"
                    : isHovered
                      ? "#496a94"
                      : articleCount > 0
                        ? "#3c5e87"
                        : "#2a3f54"
                }
                stroke="#1a2f42"
                strokeWidth="0.5"
                className="cursor-pointer transition-all duration-200"
                onClick={(event) => {
                  event.stopPropagation();
                  onCountryClick(convertIso3ToIso2(iso3Code));
                }}
                onMouseEnter={() =>
                  onCountryHover(convertIso3ToIso2(iso3Code))
                }
                onMouseLeave={() => onCountryHover(null)}
                style={{
                  filter: isSelected
                    ? "brightness(1.2)"
                    : isHovered
                      ? "brightness(1.1)"
                      : "none",
                  opacity:
                    articleCount === 0 && !isSelected ? 0.4 : 1,
                }}
              />
            );
          },
        )}
      </svg>

      {hoveredCountryIso3 && countryPaths[hoveredCountryIso3] ? (
        <div className="pointer-events-none absolute left-4 top-16 z-10 rounded border border-[#3c5e87] bg-[#1a2f42] px-3 py-2 shadow-lg">
          <div className="text-sm font-medium text-[#dfe7ef]">
            {countryPaths[hoveredCountryIso3].name}
          </div>
          <div className="mt-1 text-xs text-[#8ba3b8]">
            {countryDataIso3[hoveredCountryIso3] ?? 0} articles
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <MapActionButton
          title="Zoom in"
          onClick={() =>
            setTransform((current) => ({
              ...current,
              scale: Math.min(8, current.scale * 1.2),
            }))
          }
        >
          <Plus size={18} />
        </MapActionButton>
        <MapActionButton
          title="Zoom out"
          onClick={() =>
            setTransform((current) => ({
              ...current,
              scale: Math.max(0.5, current.scale * 0.8),
            }))
          }
        >
          <Minus size={18} />
        </MapActionButton>
        <MapActionButton title="Reset view" onClick={resetView}>
          <RotateCcw size={16} />
        </MapActionButton>
      </div>

      <div className="absolute bottom-4 left-4 z-10 rounded border border-[#3c5e87] bg-[#1a2f42] px-4 py-3 shadow-lg">
        <div className="mb-2 text-xs font-medium text-[#dfe7ef]">
          Map Legend
        </div>
        <div className="space-y-1.5">
          <LegendRow colorClassName="bg-[#58c1d8]" label="Selected" />
          <LegendRow
            colorClassName="bg-[#3c5e87]"
            label="Has articles"
          />
          <LegendRow
            colorClassName="bg-[#2a3f54]"
            label="No data"
            style={{ opacity: 0.4 }}
          />
        </div>
        <div className="mt-2 border-t border-[#3c5e87]/30 pt-2 text-xs text-[#8ba3b8]/70">
          {Object.keys(countryPaths).length} countries loaded
        </div>
      </div>

      {selectedCountries.length > 0 ? (
        <div className="absolute left-4 top-4 z-10">
          <button
            onClick={onClearCountries}
            className="flex items-center gap-1.5 rounded bg-[#3c5e87] px-3 py-2 text-xs font-medium text-[#dfe7ef] shadow-lg transition-colors hover:bg-[#496a94]"
          >
            <X size={14} />
            Clear selected Countries ({selectedCountries.length})
          </button>
        </div>
      ) : null}

      <div className="absolute bottom-4 right-16 z-10 rounded border border-[#3c5e87]/50 bg-[#1a2f42]/90 px-3 py-2 text-xs text-[#8ba3b8] shadow-lg">
        <div>Click: Select country</div>
        <div>Drag: Pan map</div>
        <div>Scroll: Zoom</div>
        <div>Double-click: Reset</div>
      </div>
    </div>
  );
}

function MapActionButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-10 w-10 items-center justify-center rounded bg-[#1a2f42] text-[#dfe7ef] shadow-lg transition-colors hover:bg-[#3c5e87]"
    >
      {children}
    </button>
  );
}

function LegendRow({
  colorClassName,
  label,
  style,
}: {
  colorClassName: string;
  label: string;
  style?: CSSProperties;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-4 w-4 rounded-sm border border-[#1a2f42] ${colorClassName}`}
        style={style}
      />
      <span className="text-xs text-[#8ba3b8]">{label}</span>
    </div>
  );
}
