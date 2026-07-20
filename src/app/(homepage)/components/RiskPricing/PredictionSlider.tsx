"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Slider } from "@kleros/ui-components-library";
import clsx from "clsx";

import { useRiskPredictionStore } from "@/store/riskMarketStore";

import { RiskPricingOutcome } from "@/hooks/useMarketData";

import { Skeleton } from "@/components/Skeleton";
import WithHelpTooltip from "@/components/WithHelpTooltip";

import { getReadableTextColor } from "@/utils/getReadableTextColor";

import { MARKET_PD_TOOLTIP, zoneAxis, zones } from "./constants";
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
      zones.find((z) => marketPercent >= z.from && marketPercent <= z.to) ??
      zones[0],
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
    // The inset lives on this OUTER wrapper, never on the relative container
    // below: `left: %` on the marker resolves against the padding box, so
    // padding the positioning context itself would shift and rescale the
    // marker away from the track. Insetting here keeps the marker exactly on
    // its value while giving the centred "Market PD (Ann.)" label room to stay
    // inside the accordion body, which is overflow-hidden for its animation.
    <div className="w-full px-10">
      <div className="relative w-full">
        {/* Market-probability marker (does not move while dragging) */}
        {/* Raised 28px above the original -40px: the pill used to sit at
            -24..-2, right on top of the Slider's own bold value label at
            -23..-3, hiding it whenever the prediction is near the market.
            The stem grows by the same 28px so it still lands on the track. */}
        <div
          className="pointer-events-none absolute top-[-68px] z-20"
          style={{
            left: `${scale(marketPercent)}%`,
            transform: "translateX(-50%)",
          }}
        >
          {/* pointer-events-auto: the marker wrapper disables pointer events so
            it never blocks the slider, but the tooltip still needs hover. */}
          <div className="pointer-events-auto flex items-center justify-center whitespace-nowrap">
            <label className="text-klerosUIComponentsPrimaryText text-xs">
              Market PD (Ann.)
            </label>
            <WithHelpTooltip tooltipMsg={MARKET_PD_TOOLTIP} place="top" />
          </div>

          <div
            className={clsx("rounded-base px-2 py-0.75 text-center text-xs")}
            style={{
              backgroundColor: isNoToAll ? "#7bcbff" : color,
              color: getReadableTextColor(isNoToAll ? "#7bcbff" : color),
            }}
          >
            {`${marketPercent.toFixed(3)}%`}
          </div>

          {/* One unbroken line from the pill down over the track and thumb.
              Where it meets the Slider's bold value label, that label masks it
              with the card background — see the #slider-label rules below. */}
          <span className="bg-klerosUIComponentsPrimaryText absolute top-full left-1/2 h-16 w-0.75 -translate-x-1/2 rounded-b-full" />
        </div>

        {/* Slider */}
        <Slider
          className={clsx(
            "w-full",
            "[&_#slider-label]:!text-klerosUIComponentsPrimaryText",
            "[&_#slider-label]:font-semibold",

            // The market marker's stem passes behind this label. Give the
            // label the card's own background so it masks the line rather than
            // being struck through by it. The z-index has to go on the thumb
            // wrapper (the label's direct parent), not the label: the wrapper
            // is a stacking context, so a z-index on the label alone can never
            // rise above the z-20 marker outside it.
            "[&_div:has(>#slider-label)]:z-30",
            "[&_#slider-label]:bg-klerosUIComponentsLightBackground",
            "[&_#slider-label]:rounded-base",
            "[&_#slider-label]:px-1",

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
    </div>
  );
};

export default React.memo(PredictionSlider);
