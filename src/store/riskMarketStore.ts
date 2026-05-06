import { RiskPricingOutcome } from "@/hooks/useMarketData";
import { create } from "zustand";

type Predictions = Record<string, number>;

type Store = {
  riskPredictions: Predictions;
  setRiskPredictions: (predictions: Predictions) => void;
  removePrediction: (key: string) => void;
  resetRiskPredictions: () => void;

  outcomes: RiskPricingOutcome[];
  setOutcomes: (outcomes: RiskPricingOutcome[]) => void;
};

export const useRiskPredictionStore = create<Store>((set) => ({
  riskPredictions: {},

  setRiskPredictions: (predictions) =>
    set((state) => ({
      riskPredictions: {
        ...state.riskPredictions,
        ...predictions,
      },
    })),

  removePrediction: (key) =>
    set((state) => {
      const next = { ...state.riskPredictions };
      delete next[key];

      return {
        riskPredictions: next,
      };
    }),

  resetRiskPredictions: () =>
    set(() => ({
      riskPredictions: {},
    })),

  outcomes: [],

  setOutcomes: (outcomes) =>
    set(() => ({
      outcomes,
    })),
}));
