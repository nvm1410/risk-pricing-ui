"use client";

import { Slider } from "@kleros/ui-components-library";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { useSize } from "react-use";

import { Skeleton } from "@/components/Skeleton";

import { RiskPricingOutcome } from "@/hooks/useMarketData";
import { useRiskPredictionStore } from "@/store/riskMarketStore";
import { formatWithPrecision } from "@/utils";
import { getReadableTextColor } from "@/utils/getReadableTextColor";
import { zones } from "./constants";
import { interpolateColor } from "./utils";
import { isTwoStringsEqual } from "@/hooks/liquidity/utils";

const LoadingSkeleton: React.FC = () => (
  <div className="relative w-full">
    <Skeleton className="h-2 w-full rounded-[30px]" />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3">
      <Skeleton className="h-[22px] w-[42px]" />
      <Skeleton
        className="mx-auto h-9 w-0.75 rounded-b-full"
        variant="secondary"
      />
    </div>
  </div>
);

const PredictionSliderContent = ({
  outcome,
  isNoToAll,
}: {
  outcome: RiskPricingOutcome;
  isNoToAll: boolean;
}) => {
  const maxValue = isNoToAll ? 100 : 20;
  const predictions = useRiskPredictionStore((state) => state.riskPredictions);
  const setPredictions = useRiskPredictionStore(
    (state) => state.setRiskPredictions,
  );
  const prediction =
    (predictions[outcome.outcomeId] ?? outcome.probability) * 100;
  const zone =
    zones.find(
      (zone) =>
        outcome.probability >= zone.from && outcome.probability <= zone.to,
    ) ?? zones[0];
  const color = interpolateColor(
    zone.colors[0],
    zone.colors[1],
    (outcome.probability - zone.from) / (zone.to - zone.from),
  );
  const leftPercent = ((outcome.probability * 100) / maxValue) * 100;
  const [sized] = useSize(
    () => (
      <div className="relative w-full">
        <Slider
          className={clsx(
            "w-full",
            "[&_#slider-label]:!text-klerosUIComponentsPrimaryText [&_#slider-label]:font-semibold",
          )}
          step={0.0001}
          maxValue={maxValue}
          minValue={0}
          value={prediction}
          leftLabel=""
          rightLabel=""
          aria-label="Slider"
          callback={(value) =>
            setPredictions({ [outcome.outcomeId]: value / 100 })
          }
          formatter={(value) => `${value}%`}
          // @ts-expect-error other values not needed
          theme={{
            sliderColor: "#D2FFDC",
            thumbColor: "#D2FFDC",
          }}
        />
        {!isNoToAll && (
          <>
            <div className="mt-2 flex h-10 overflow-visible rounded-xl">
              {zones.map((zone) => (
                <div
                  key={zone.label}
                  className="relative flex items-center justify-center"
                  style={{
                    width: `${((zone.to - zone.from) / maxValue) * 100}%`,
                    background: `linear-gradient(to right, ${zone.colors[0]}, ${zone.colors[1]})`,
                  }}
                >
                  <div className="absolute -top-4 rounded-full border-4 border-white bg-white text-xl">
                    {zone.emoji}
                  </div>

                  <span className="mt-4 text-[10px] font-medium text-neutral-700">
                    {zone.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative mt-1 h-4 text-xs text-neutral-500">
              {[0, 3, 5, 10, 20].map((value) => (
                <div
                  key={value}
                  className="absolute -translate-x-1/2"
                  style={{
                    left: `${(value / 20) * 100}%`,
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          </>
        )}
        <div
          className="pointer-events-none absolute top-[-40px]"
          style={{
            left: `${leftPercent}%`,
            transform: "translateX(-50%)",
          }}
        >
          <label className="text-klerosUIComponentsPrimaryText block w-full text-center text-xs">
            Market
          </label>
          <div
            className={clsx("rounded-base px-2 py-0.75 text-center text-xs")}
            style={{
              backgroundColor: color,
              color: getReadableTextColor(color),
            }}
          >
            {`${(outcome.probability * 100).toFixed(3)}%`}
          </div>
          <span className="bg-klerosUIComponentsPrimaryText mx-auto block h-9 w-0.75 rounded-b-full" />
        </div>
      </div>
    ),
    { width: 300 },
  );

  return sized;
};

const PredictionSlider = dynamic(
  () => Promise.resolve(PredictionSliderContent),
  {
    ssr: false,
    loading: () => <LoadingSkeleton />,
  },
);

export default PredictionSlider;
