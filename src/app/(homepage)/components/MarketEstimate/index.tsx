"use client";

import { useMemo, useState } from "react";

import { useRiskPdHistory } from "@/hooks/useRiskPdHistory";

import Loader from "@/components/Loader";

import ChartBarIcon from "@/assets/svg/chart-bar.svg";
import StatsBarIcon from "@/assets/svg/stats-bar.svg";

import { cn } from "@/utils";

import Chart from "../Chart";
import { assetColors } from "../RiskPricing/constants";
import MarketEstimateRisk, {
  type AssetRisk,
} from "../RiskPricing/MarketEstimateRisk";

export type RiskView = "bars" | "overTime";

const VIEWS: Array<{
  id: RiskView;
  label: string;
  Icon: React.FC<{ className?: string }>;
}> = [
  { id: "bars", label: "Risk bars", Icon: StatsBarIcon },
  { id: "overTime", label: "Over time", Icon: ChartBarIcon },
];

interface IMarketEstimate {
  assets: AssetRisk[];
  noToAllProbability?: number;
}

/**
 * Owns everything the two views share - title, asset legend, and the view
 * toggle - so switching modes only swaps the plot underneath. Asset visibility
 * and colours are held here rather than per-view, which is what keeps a hidden
 * asset hidden (and every asset the same colour) across a mode switch.
 */
const MarketEstimate: React.FC<IMarketEstimate> = ({
  assets,
  noToAllProbability,
}) => {
  const [view, setView] = useState<RiskView>("bars");

  // Gated on the view: the solve costs nothing for users who never open the
  // time-series tab, and is cached for the session once they do.
  const {
    series,
    isLoading: isChartLoading,
    isEmpty: isChartEmpty,
    error: chartError,
    progress: chartProgress,
  } = useRiskPdHistory(view === "overTime");

  const [hiddenAssets, setHiddenAssets] = useState<Set<string>>(new Set());
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  const toggleAsset = (symbol: string) =>
    setHiddenAssets((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });

  const allHidden = hiddenAssets.size === assets.length && assets.length > 0;
  const toggleAll = () =>
    setHiddenAssets(
      allHidden ? new Set() : new Set(assets.map((a) => a.symbol)),
    );

  // Colour is keyed to position in the full asset list, so it never shifts when
  // assets are hidden and always agrees between the bars and the lines.
  const colorOf = useMemo(() => {
    const map = new Map<string, string>();
    assets.forEach((asset, index) =>
      map.set(asset.symbol, assetColors[index % assetColors.length]),
    );
    return map;
  }, [assets]);

  const visibleAssets = useMemo(
    () => assets.filter((a) => !hiddenAssets.has(a.symbol)),
    [assets, hiddenAssets],
  );

  const visibleSeries = useMemo(
    () => series?.filter((s) => !hiddenAssets.has(s.symbol)) ?? [],
    [series, hiddenAssets],
  );

  return (
    <div className="w-full">
      {/* Title + view toggle */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-klerosUIComponentsPrimaryText text-2xl font-semibold">
          Market Estimate Risk
        </h2>
        <div className="border-klerosUIComponentsStroke flex items-center gap-1 rounded-lg border p-0.5">
          {VIEWS.map(({ id, label, Icon }) => {
            const isActive = id === view;
            return (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={isActive}
                onClick={() => setView(id)}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-md p-1.5 transition-colors",
                  // The icons hardcode a fill, so recolour their paths directly.
                  "[&_path]:fill-current",
                  isActive
                    ? "bg-klerosUIComponentsMediumBlue text-klerosUIComponentsPrimaryBlue"
                    : "text-klerosUIComponentsSecondaryText hover:text-klerosUIComponentsPrimaryBlue",
                )}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Shared asset legend */}
      <div
        className="mb-6 flex flex-wrap gap-2"
        onMouseLeave={() => setHoveredSymbol(null)}
      >
        {assets.map((asset) => {
          const active = !hiddenAssets.has(asset.symbol);
          return (
            <button
              key={asset.symbol}
              onClick={() => toggleAsset(asset.symbol)}
              onMouseEnter={() => setHoveredSymbol(asset.symbol)}
              className={cn(
                "cursor-pointer rounded-full border px-2 py-1 text-xs font-medium transition",
                "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                active
                  ? "border-transparent text-white"
                  : "border-neutral-300 bg-white text-neutral-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400",
              )}
              style={
                active
                  ? { backgroundColor: colorOf.get(asset.symbol) }
                  : undefined
              }
            >
              {asset.symbol}
            </button>
          );
        })}

        <button
          onClick={toggleAll}
          className="cursor-pointer rounded-full border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          {allHidden ? "Select all" : "Clear all"}
        </button>
      </div>

      {view === "bars" ? (
        <MarketEstimateRisk
          assets={visibleAssets}
          colorOf={colorOf}
          noToAllProbability={noToAllProbability}
        />
      ) : isChartEmpty || chartError ? (
        <div className="text-klerosUIComponentsSecondaryText flex h-96 w-full items-center justify-center text-sm">
          {chartError
            ? "Could not compute the probability history."
            : "Not enough price history yet to chart."}
        </div>
      ) : isChartLoading || !series ? (
        <div className="flex h-96 w-full flex-col items-center justify-center gap-3">
          <Loader />
          <span className="text-klerosUIComponentsSecondaryText text-sm">
            Solving implied probabilities… {Math.round(chartProgress * 100)}%
          </span>
        </div>
      ) : (
        <Chart series={visibleSeries} hoveredSymbol={hoveredSymbol} />
      )}
    </div>
  );
};

export default MarketEstimate;
