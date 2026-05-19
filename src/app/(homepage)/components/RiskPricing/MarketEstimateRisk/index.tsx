import { useState } from "react";

import { assetColors, zoneAxis, zones } from "../constants";

type AssetRisk = {
  symbol: string;
  risk: number;
};

type MarketEstimateRiskProps = {
  assets: AssetRisk[];
  maxRisk?: number;
  noToAllProbability?: number;
};

export default function MarketEstimateRisk({
  assets,
  maxRisk = 100,
  noToAllProbability,
}: MarketEstimateRiskProps) {
  const [visibleAssets, setVisibleAssets] = useState<string[]>(
    assets.map((a) => a.symbol),
  );

  const toggleAsset = (symbol: string) => {
    setVisibleAssets((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol],
    );
  };

  /**
   * Log scale mapping
   * Keeps low-end ranges visually meaningful
   */
  const scale = (value: number) => {
    if (value <= 0) return 0;

    return Math.log(value + 1) / Math.log(maxRisk + 1);
  };

  /**
   * Convert value -> percent on screen
   */
  const scaledPercent = (value: number) => scale(value) * 100;

  return (
    <>
      {/* Pills */}
      <div className="flex flex-wrap gap-2 p-6">
        {assets.map((asset, index) => {
          const assetColor = assetColors[index % assetColors.length];
          const active = visibleAssets.includes(asset.symbol);

          return (
            <button
              key={asset.symbol}
              onClick={() => toggleAsset(asset.symbol)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition hover:bg-neutral-100 ${
                active
                  ? "border-transparent text-white"
                  : "border-neutral-300 bg-white text-neutral-500"
              }`}
              style={
                active
                  ? {
                      backgroundColor: assetColor,
                    }
                  : undefined
              }
            >
              {asset.symbol}
            </button>
          );
        })}

        <button
          onClick={() => setVisibleAssets([])}
          className="cursor-pointer rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100"
        >
          Clear all
        </button>
      </div>

      {/* Chart */}
      <div className="w-full">
        <h2 className="mb-8 text-2xl font-semibold text-[#333333]">
          Market Estimate Risk
        </h2>

        <div className="relative">
          {/* Grid lines */}
          <div className="pointer-events-none absolute inset-0">
            {zoneAxis.map((value) => (
              <div
                key={value}
                className="absolute top-0 border-l border-dashed border-neutral-300"
                style={{
                  left: `${scaledPercent(value)}%`,
                  height: "calc(100% - 120px)",
                }}
              />
            ))}
          </div>

          {/* Assets */}
          <div className="space-y-5">
            {assets
              .filter((asset) => visibleAssets.includes(asset.symbol))
              .map((asset, index) => {
                const assetColor = assetColors[index % assetColors.length];

                /**
                 * Track width uses LOG SCALE
                 */
                const widthPercent = scaledPercent(asset.risk);

                /**
                 * Gradient stops relative to the asset width
                 */
                const gradientStops = zones
                  .flatMap((zone) => {
                    if (zone.from >= asset.risk) return [];

                    const clampedTo = Math.min(zone.to, asset.risk);

                    /**
                     * IMPORTANT:
                     * Normalize against asset risk,
                     * not global maxRisk
                     */
                    const start = (scale(zone.from) / scale(asset.risk)) * 100;

                    const end = (scale(clampedTo) / scale(asset.risk)) * 100;

                    const [from, to] = zone.colors;

                    return [`${from} ${start}%`, `${to} ${end}%`];
                  })
                  .join(", ");

                return (
                  <div key={asset.symbol} className="relative h-8">
                    {/* Gradient track */}
                    <div
                      className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full"
                      style={{
                        width: `${widthPercent}%`,
                        background: `linear-gradient(to right, ${gradientStops})`,
                      }}
                    />

                    {/* Overlay */}
                    <div
                      className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full opacity-70"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: assetColor,
                      }}
                    />

                    {/* Badge */}
                    <div
                      className="absolute top-1/2 z-10 -translate-y-1/2"
                      style={{
                        left: `${widthPercent}%`,
                        transform: "translate(-8%, -50%)",
                      }}
                    >
                      <div
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-white shadow"
                        style={{
                          backgroundColor: assetColor,
                        }}
                      >
                        <span>{asset.symbol}</span>
                        <span>{asset.risk}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Zones */}
          <div className="relative mt-14">
            <div className="overflow-visible rounded-xl">
              <div className="flex h-24 overflow-visible">
                {zones.map((zone) => {
                  /**
                   * Zone width also uses LOG SCALE
                   */
                  const left = scale(zone.from);
                  const right = scale(zone.to);

                  const width = (right - left) * 100;

                  return (
                    <div
                      key={zone.label}
                      className="relative flex flex-col items-center justify-center overflow-visible"
                      style={{
                        width: `${width}%`,
                        background: `linear-gradient(to right, ${zone.colors[0]}, ${zone.colors[1]})`,
                      }}
                    >
                      {/* Emoji */}
                      <div className="absolute -top-5 z-20 rounded-full border-[4px] border-white bg-white text-3xl">
                        {zone.emoji}
                      </div>

                      {/* Label */}
                      <div className="mt-5 text-sm font-medium text-neutral-800">
                        {zone.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Axis */}
            <div className="relative mt-3 h-5 text-sm text-neutral-600">
              {zoneAxis.map((value) => (
                <div
                  key={value}
                  className="absolute -translate-x-1/2"
                  style={{
                    left: `${scaledPercent(value)}%`,
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
          {noToAllProbability !== undefined && (
            <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-emerald-700">
                    NO TO ALL
                  </div>

                  <div className="mt-1 text-xs text-emerald-600">
                    Chance that no listed asset defaults
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>

                  <span className="text-2xl font-bold text-emerald-700">
                    {noToAllProbability}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
