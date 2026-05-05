import { useState } from "react";
import { assetColors } from "../constants";

type AssetRisk = {
  symbol: string;
  risk: number;
};

type Zone = {
  label: string;
  emoji: string;
  from: number;
  to: number;
};

type MarketEstimateRiskProps = {
  assets: AssetRisk[];
  maxRisk?: number;
};

const zones: Zone[] = [
  {
    label: "SAFE",
    emoji: "😊",
    from: 0,
    to: 3,
  },
  {
    label: "CAUTION",
    emoji: "🙄",
    from: 3,
    to: 5,
  },
  {
    label: "WARNING",
    emoji: "😬",
    from: 5,
    to: 10,
  },
  {
    label: "DANGER",
    emoji: "😱",
    from: 10,
    to: 20,
  },
];

export default function MarketEstimateRisk({
  assets,
  maxRisk = 20,
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
  return (
    <>
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
      <div className="w-full">
        <h2 className="mb-8 text-2xl font-semibold text-[#333333]">
          Market Estimate Risk
        </h2>

        <div className="relative">
          {/* Grid lines */}
          <div className="pointer-events-none absolute inset-0">
            {[0, 3, 5, 10, 20].map((value) => (
              <div
                key={value}
                className="absolute top-0 border-l border-dashed border-neutral-300"
                style={{
                  left: `${(value / maxRisk) * 100}%`,
                  height: "calc(100% - 120px)", // adjust this
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
                const gradientStops = zones
                  .flatMap((zone, index) => {
                    // Skip zones completely outside asset risk
                    if (zone.from >= asset.risk) return [];

                    // Clamp zone end to asset risk
                    const clampedTo = Math.min(zone.to, asset.risk);

                    // Normalize relative to THIS asset risk
                    const start = (zone.from / asset.risk) * 100;
                    const end = (clampedTo / asset.risk) * 100;

                    const colors = [
                      ["#bbf7d0", "#dcfce7"],
                      ["#fef9c3", "#fed7aa"],
                      ["#fbcfe8", "#f9a8d4"],
                      ["#f9a8d4", "#fb7185"],
                    ];

                    const [from, to] = colors[index];

                    return [`${from} ${start}%`, `${to} ${end}%`];
                  })
                  .join(", ");
                const widthPercent = (asset.risk / maxRisk) * 100;

                return (
                  <div key={asset.symbol} className="relative h-8">
                    {/* Zone gradient track */}
                    <div
                      className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full"
                      style={{
                        width: `${widthPercent}%`,
                        background: `linear-gradient(to right, ${gradientStops})`,
                      }}
                    />

                    {/* Asset overlay */}
                    <div
                      className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full opacity-70"
                      style={{
                        width: `${widthPercent}%`,
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
            {/* overflow-visible is important */}
            <div className="overflow-visible rounded-xl">
              <div className="flex h-24 overflow-visible">
                {zones.map((zone, index) => {
                  const width = ((zone.to - zone.from) / maxRisk) * 100;

                  const backgrounds = [
                    "bg-gradient-to-r from-green-200 to-green-100",
                    "bg-gradient-to-r from-yellow-100 to-orange-100",
                    "bg-gradient-to-r from-pink-100 to-pink-200",
                    "bg-gradient-to-r from-pink-300 to-rose-400",
                  ];

                  return (
                    <div
                      key={zone.label}
                      className={`relative flex flex-col items-center justify-center overflow-visible ${backgrounds[index]}`}
                      style={{
                        width: `${width}%`,
                      }}
                    >
                      {/* Emoji half outside */}
                      <div className="absolute -top-5 z-20 rounded-full border-[2px] border-white bg-white text-3xl">
                        {zone.emoji}
                      </div>

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
              {[0, 3, 5, 10, 20].map((value) => (
                <div
                  key={value}
                  className="absolute -translate-x-1/2"
                  style={{
                    left: `${(value / maxRisk) * 100}%`,
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
