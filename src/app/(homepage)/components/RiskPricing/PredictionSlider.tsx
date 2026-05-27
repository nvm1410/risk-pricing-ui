"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Slider } from "@kleros/ui-components-library";
import clsx from "clsx";

import { useRiskPredictionStore } from "@/store/riskMarketStore";

import { RiskPricingOutcome } from "@/hooks/useMarketData";

import { Skeleton } from "@/components/Skeleton";

import { getReadableTextColor } from "@/utils/getReadableTextColor";

import { zoneAxis, zones } from "./constants";
import { interpolateColor } from "./utils";

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
const maxValue = 100;

const PredictionSlider = ({
  outcome,
  isNoToAll,
}: {
  outcome: RiskPricingOutcome;
  isNoToAll: boolean;
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const scale = useCallback(
    (value: number) => {
      if (isNoToAll) return value;
      if (value <= 0) return 0;

      return (Math.log10(value + 1) / Math.log10(maxValue + 1)) * maxValue;
    },
    [isNoToAll],
  );

  const fromScaledValue = useCallback(
    (scaled: number) => {
      if (isNoToAll) return scaled;
      return Math.pow(10, (scaled / maxValue) * Math.log10(maxValue + 1)) - 1;
    },
    [isNoToAll],
  );

  const prediction = useRiskPredictionStore(
    (state) =>
      (state.riskPredictions[outcome.outcomeId] ?? outcome.probability) * 100,
  );

  const setPredictions = useRiskPredictionStore(
    (state) => state.setRiskPredictions,
  );

  const zone = useMemo(
    () =>
      zones.find(
        (zone) =>
          outcome.probability * 100 >= zone.from &&
          outcome.probability * 100 <= zone.to,
      ) ?? zones[0],
    [outcome.probability],
  );

  const color = useMemo(
    () =>
      interpolateColor(
        zone.colors[0],
        zone.colors[1],
        (outcome.probability * 100 - zone.from) / (zone.to - zone.from),
      ),
    [outcome.probability, zone],
  );

  if (!mounted) return <LoadingSkeleton />;

  return (
    <div className="relative w-full">
      {/* Marker */}
      <div
        className="pointer-events-none absolute top-[-40px] z-20"
        style={{
          left: `${scale(outcome.probability * 100)}%`,
          transform: "translateX(-50%)",
        }}
      >
        <label className="text-klerosUIComponentsPrimaryText block w-full text-center text-xs">
          Market
        </label>

        <div
          className={clsx("rounded-base px-2 py-0.75 text-center text-xs")}
          style={{
            backgroundColor: isNoToAll ? "#7bcbff" : color,
            color: getReadableTextColor(isNoToAll ? "#7bcbff" : color),
          }}
        >
          {`${(outcome.probability * 100).toFixed(3)}%`}
        </div>

        <span className="bg-klerosUIComponentsPrimaryText mx-auto block h-9 w-0.75 rounded-b-full" />
      </div>

      {/* Slider */}
      <Slider
        className={clsx(
          "w-full",
          "[&_#slider-label]:!text-klerosUIComponentsPrimaryText",
          "[&_#slider-label]:font-semibold",

          // Thumb
          "[&_[role=slider]]:border-4",
          "[&_[role=slider]]:border-white",
          "[&_[role=slider]]:bg-white",
          "[&_[role=slider]]:shadow-md",
        )}
        step={0.0001}
        maxValue={maxValue}
        minValue={0}
        value={scale(prediction)}
        leftLabel=""
        rightLabel=""
        aria-label="Slider"
        callback={(value) =>
          setPredictions({
            [outcome.outcomeId]: fromScaledValue(value) / 100,
          })
        }
        formatter={(value) => `${fromScaledValue(value).toFixed(3)}%`}
        // @ts-expect-error other values not needed
        theme={{
          sliderColor: "#D2FFDC",
          thumbColor: "#D2FFDC",
        }}
      />

      {/* Zones */}
      {!isNoToAll && (
        <div className="mt-3 flex h-12 overflow-visible rounded-xl">
          {zones.map((zone) => {
            const width = scale(zone.to) - scale(zone.from);

            return (
              <div
                key={zone.label}
                className="relative flex items-center justify-center overflow-visible"
                style={{
                  width: `${width}%`,
                  background: `linear-gradient(to right, ${zone.colors[0]}, ${zone.colors[1]})`,
                }}
              >
                {/* Emoji */}
                <div className="absolute -top-4 z-10 rounded-full border-4 border-white bg-white text-xl">
                  {zone.emoji}
                </div>

                {/* Label */}
                <span className="mt-4 px-1 text-center text-[10px] font-medium text-neutral-700">
                  {zone.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Axis */}
      {!isNoToAll && (
        <div className="relative mt-2 h-4 text-xs text-neutral-500">
          {zoneAxis.map((value) => (
            <div
              key={value}
              className="absolute -translate-x-1/2"
              style={{
                left: `${scale(value)}%`,
              }}
            >
              {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PredictionSlider;
