"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

// ---------------------------------------------------------------------------
// Helpers — extracted outside the component so they never re-create.
// ---------------------------------------------------------------------------

const identityScale = (v: number) => v;
const identityFromScaled = (v: number) => v;

const logScale = (value: number) => {
  if (value <= 0) return 0;
  return (Math.log10(value + 1) / Math.log10(maxValue + 1)) * maxValue;
};

const logFromScaled = (scaled: number) => {
  return Math.pow(10, (scaled / maxValue) * Math.log10(maxValue + 1)) - 1;
};

// ---------------------------------------------------------------------------
// Static children that don't depend on per-outcome state — computed once per
// isNoToAll flag instead of once per slider.
// ---------------------------------------------------------------------------

const ZoneBar = React.memo(function ZoneBar() {
  return (
    <div className="mt-3 flex h-12 overflow-visible rounded-xl">
      {zones.map((zone) => {
        const width = logScale(zone.to) - logScale(zone.from);
        return (
          <div
            key={zone.label}
            className="relative flex items-center justify-center overflow-visible"
            style={{
              width: `${width}%`,
              background: `linear-gradient(to right, ${zone.colors[0]}, ${zone.colors[1]})`,
            }}
          >
            <div className="absolute -top-4 z-10 rounded-full border-4 border-white bg-white text-xl">
              {zone.emoji}
            </div>
            <span className="mt-4 px-1 text-center text-[10px] font-medium text-neutral-700">
              {zone.label}
            </span>
          </div>
        );
      })}
    </div>
  );
});

const Axis = React.memo(function Axis() {
  return (
    <div className="relative mt-2 h-4 text-xs text-neutral-500">
      {zoneAxis.map((value) => (
        <div
          key={value}
          className="absolute -translate-x-1/2"
          style={{ left: `${logScale(value)}%` }}
        >
          {value}
        </div>
      ))}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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

  // Scale helpers — pick identity or log based on isNoToAll.
  const scale = isNoToAll ? identityScale : logScale;
  const fromScaledValue = isNoToAll ? identityFromScaled : logFromScaled;

  // Store subscription — only re-renders when THIS outcome's prediction
  // changes (or when outcome.probability changes).
  const prediction = useRiskPredictionStore(
    useCallback(
      (state) =>
        (state.riskPredictions[outcome.outcomeId] ?? outcome.probability) * 100,
      [outcome.outcomeId, outcome.probability],
    ),
  );

  const setPredictions = useRiskPredictionStore(
    (state) => state.setRiskPredictions,
  );

  // ------------------------------------------------------------------
  // Drag-local state: while the user is sliding, updates go to local
  // state only — no store writes, so sibling sliders don't re-render.
  // On drag-end (onChangeEnd), the local value is flushed to the store.
  // ------------------------------------------------------------------
  const [draftValue, setDraftValue] = useState<number | null>(null);
  const draftRef = useRef<number | null>(null); // stable ref for cleanup

  // Flush draft to store on unmount (e.g. if user starts dragging and
  // navigates away without releasing).
  useEffect(() => {
    return () => {
      if (draftRef.current !== null) {
        setPredictions({ [outcome.outcomeId]: draftRef.current / 100 });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = useCallback(
    (scaled: number) => {
      const real = fromScaledValue(scaled);
      draftRef.current = real;
      setDraftValue(real);
    },
    [fromScaledValue],
  );

  const handleChangeEnd = useCallback(
    (scaled: number | number[]) => {
      const real = fromScaledValue(Array.isArray(scaled) ? scaled[0] : scaled);
      draftRef.current = null;
      setDraftValue(null);
      setPredictions({ [outcome.outcomeId]: real / 100 });
    },
    [outcome.outcomeId, fromScaledValue, setPredictions],
  );

  const displayValue = draftValue ?? prediction;

  const formatted = useCallback(
    (scaled: number) => `${fromScaledValue(scaled).toFixed(3)}%`,
    [fromScaledValue],
  );

  // Market-probability derived values (do not change during dragging).
  const marketPercent = outcome.probability * 100;

  const zone = useMemo(
    () =>
      zones.find(
        (z) => marketPercent >= z.from && marketPercent <= z.to,
      ) ?? zones[0],
    [marketPercent],
  );

  const color = useMemo(
    () =>
      interpolateColor(
        zone.colors[0],
        zone.colors[1],
        (marketPercent - zone.from) / (zone.to - zone.from),
      ),
    [marketPercent, zone],
  );

  const theme = useMemo(
    () => ({
      sliderColor: "#D2FFDC",
      thumbColor: "#D2FFDC",
    }),
    [],
  );

  if (!mounted) return <LoadingSkeleton />;

  return (
    <div className="relative w-full">
      {/* Market-probability marker (does not move while dragging) */}
      <div
        className="pointer-events-none absolute top-[-40px] z-20"
        style={{
          left: `${scale(marketPercent)}%`,
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
          {`${marketPercent.toFixed(3)}%`}
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
        value={scale(displayValue)}
        leftLabel=""
        rightLabel=""
        aria-label="Slider"
        callback={handleChange}
        onChangeEnd={handleChangeEnd}
        formatter={formatted}
        // @ts-expect-error other values not needed
        theme={theme}
      />

      {!isNoToAll && <ZoneBar />}
      {!isNoToAll && <Axis />}
    </div>
  );
};

export default React.memo(PredictionSlider);
