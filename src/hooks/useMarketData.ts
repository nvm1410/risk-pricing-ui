"use client";
import { useQuery } from "@tanstack/react-query";
import { gnosis } from "viem/chains";
import { RISK_PRICING_MARKET_ID } from "@/consts/markets";
import { Market, PoolHourData, SerializedMarket } from "@/types/market-types";
import { isTwoStringsEqual } from "./liquidity/utils";
import { solveProbsAsync, useImpliedProbsAsync } from "./useImpliedProbs";
import { Address } from "viem";
import { collateral } from "@/consts";
import { useTokensInfo } from "./useTokensInfo";

export function deserializeMarket(market: SerializedMarket): Market {
  const result = {
    ...market,
    outcomesSupply: BigInt(market.outcomesSupply),
    parentMarket: {
      ...market.parentMarket,
      payoutNumerators: market.parentMarket.payoutNumerators.map((pn) =>
        BigInt(pn),
      ),
    },
    parentOutcome: BigInt(market.parentOutcome),
    templateId: BigInt(market.templateId),
    questions: market.questions.map((question) => ({
      ...question,
      bond: BigInt(question.bond),
      min_bond: BigInt(question.min_bond),
    })),
    lowerBound: BigInt(market.lowerBound),
    upperBound: BigInt(market.upperBound),
    payoutNumerators: market.payoutNumerators.map((pn) => BigInt(pn)),
  };
  return result as Market;
}

const fetchMarket = async () => {
  const [rawMarketData, rawChartData] = await Promise.all([
    fetch(`https://app.seer.pm/.netlify/functions/get-market`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chainId: gnosis.id,
        id: RISK_PRICING_MARKET_ID,
      }),
    }).then((res) => res.json()),
    fetch("api/risk-market-chart").then((res) => res.json()),
  ]);
  const marketData = deserializeMarket(rawMarketData) as Market;
  const chartData = rawChartData.data as PoolHourData[][];
  return {
    marketData,
    chartData,
    outcomes: undefined,
  };
};
export interface RiskPricingOutcome {
  outcomeId: Address;
  outcome: string;
  collateral: Address;
  price: number;
  probability: number;
  outcomeIndex: number;
  symbol: string
}
export const useMarketData = () => {
  const queryResult = useQuery<{
    marketData: Market;
    chartData: PoolHourData[][];
    outcomes: RiskPricingOutcome[] | undefined;
  }>({
    queryKey: ["useMarketData"],
    queryFn: () => fetchMarket(),
  });
  const marketData = queryResult.data?.marketData;
  const chartData = queryResult.data?.chartData;
  const prices =
    marketData && chartData
      ? chartData.map((outcomeChartData, index) => {
          const outcomeId = marketData.wrappedTokens[index];
          const latestPoolHourData = outcomeChartData.at(-1);
          if (!latestPoolHourData) return 0;
          return isTwoStringsEqual(outcomeId, latestPoolHourData.pool.token0.id)
            ? Number(latestPoolHourData.token1Price)
            : Number(latestPoolHourData.token0Price);
        })
      : undefined;
  const state = useImpliedProbsAsync(
    prices ? (prices.at(prices.length - 2) ?? 0) : 0,
    prices?.slice(0, -2) ?? [],
    !!prices,
  );
  const probabilities =
    state.status === "done" ? [...state.probs, state.priceY, 0] : undefined;
  const { data } = useTokensInfo(marketData?.wrappedTokens, gnosis.id);
  const outcomes = marketData
    ? marketData.wrappedTokens.map((outcomeId, index) => {
        const outcome = marketData.outcomes[index] ?? "";
        return {
          outcomeId,
          outcome,
          price: prices?.[index] ?? 0,
          probability: probabilities?.[index] ?? 0,
          collateral: marketData.collateralToken,
          outcomeIndex: index,
          symbol: data?.[index]?.symbol ?? outcome.slice(0, 11).toUpperCase(),
        };
      })
    : undefined;
  if (!outcomes) return queryResult;
  return { ...queryResult, data: { ...queryResult.data, outcomes } };
};
