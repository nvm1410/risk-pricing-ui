import { SwaprV3Trade } from "@swapr/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccount, getPublicClient, writeContract } from "@wagmi/core";
import { type BytesLike } from "ethers";
import { Address, encodeFunctionData, erc20Abi, parseUnits } from "viem";

import { TradeExecutorAbi } from "@/contracts/abis/TradeExecutorAbi";
import {
  creditsManagerAbi,
  creditsManagerAddress,
  gnosisRouterAbi,
  gnosisRouterAddress,
  sDaiAddress,
  wxdaiAbi,
  wxdaiAddress,
} from "@/generated";
import { useRiskPredictionStore } from "@/store/riskMarketStore";
import { config } from "@/wagmiConfig";

import { isUndefined } from "@/utils";
import { estimateGasWithBuffer } from "@/utils/gasLimit";
import { GetQuotesResult } from "@/utils/getQuotes";
import { getMinimumAmountOut } from "@/utils/swapr";
import { waitForTransaction } from "@/utils/waitForTransaction";

import { collateral, DECIMALS, DEFAULT_CHAIN } from "@/consts";
import { RISK_PRICING_MARKET_ID } from "@/consts/markets";

import { RiskPricingOutcome } from "../useMarketData";

import { mergeFromRouter } from "./useTradeExecutorPredict";

interface PredictProps {
  tradeExecutor: Address;
  quoteResult: GetQuotesResult;
  // defined if collateral needs to minted to Parent Market
  mintAmount?: bigint;
  seerCreditsSwapQuote?: SwaprV3Trade;
}

interface Call {
  to: Address | string;
  data: string | BytesLike;
  value?: bigint;
}

// Use the available SeerCredits in TradeWallet to Mint Parent market tokens
// swap sDAI to Wxdai => Convert Wxdai to xdai (wxdai.withdraw()) => mint tokens with xdai
async function getMintFromSeerCreditsCalls(
  tradeExecutor: Address,
  seerCreditSwapQuote: SwaprV3Trade,
): Promise<Call[]> {
  const quote = seerCreditSwapQuote;

  const approveCall = {
    to: sDaiAddress,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [
        quote.approveAddress as Address,
        parseUnits(quote.maximumAmountIn().toExact(), DECIMALS),
      ],
    }),
  };

  const swapTxn = await quote.swapTransaction({ recipient: tradeExecutor });
  const executeCall = {
    to: creditsManagerAddress,
    data: encodeFunctionData({
      abi: creditsManagerAbi,
      functionName: "execute",
      args: [
        swapTxn.to! as `0x${string}`,
        swapTxn.data! as `0x${string}`,
        parseUnits(quote.maximumAmountIn().toExact(), DECIMALS),
        wxdaiAddress,
      ],
    }),
  };

  const availableWxdai = await getMinimumAmountOut(quote);
  if (!availableWxdai) {
    throw new Error("Unable to fetch Wrapped xDAI balance.");
  }

  const withdrawCall = {
    to: wxdaiAddress,
    data: encodeFunctionData({
      abi: wxdaiAbi,
      functionName: "withdraw",
      args: [availableWxdai],
    }),
  };

  // splitPosition with xDAI
  const splitCall = {
    to: gnosisRouterAddress,
    data: encodeFunctionData({
      abi: gnosisRouterAbi,
      functionName: "splitFromBase",
      args: [RISK_PRICING_MARKET_ID],
    }),
    value: availableWxdai,
  };

  return [approveCall, executeCall, withdrawCall, splitCall];
}

export const getSplitFromTradeExecutorCalls = ({
  amount,
}: Pick<
  {
    tradeExecutor: Address;
    amount: bigint;
  },
  "amount"
>) => {
  const approveCall = {
    to: collateral.address,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [gnosisRouterAddress, amount],
    }),
  };
  const splitCall = {
    to: gnosisRouterAddress,
    data: encodeFunctionData({
      abi: gnosisRouterAbi,
      functionName: "splitPosition",
      args: [collateral.address, RISK_PRICING_MARKET_ID, amount],
    }),
  };
  const calls = [approveCall, splitCall];
  return calls;
};

const getApproveCalls = async (
  quoteResult: GetQuotesResult,
  outcomeIds: Address[],
) => {
  const { quotes, mergeAmount } = quoteResult;
  const { sellQuotes, buyQuotes } = quotes;
  console.log(quotes);
  // sell approve calls - consolidate by (token, spender) in case multiple sells
  // share the same token (defensive, typically each sell is a different outcome)
  const sellApproveByKey = new Map<
    string,
    { token: Address; spender: Address; amount: bigint }
  >();
  for (const quote of sellQuotes) {
    const token = quote.inputAmount.currency.address! as Address;
    const spender = quote.approveAddress as Address;
    const amount = parseUnits(quote.maximumAmountIn().toExact(), DECIMALS);
    console.log({ amount });
    const key = `${token}-${spender}`;
    const existing = sellApproveByKey.get(key);
    sellApproveByKey.set(key, {
      token,
      spender,
      amount: existing ? existing.amount + amount : amount,
    });
  }
  const sellApproveCalls = [...sellApproveByKey.values()].map(
    ({ token, spender, amount }) => ({
      to: token,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
      }),
    }),
  );

  // approve gnosis router to merge
  const mergeApproveCalls =
    mergeAmount > 0n
      ? outcomeIds.map((x) => ({
          to: x,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [gnosisRouterAddress, mergeAmount],
          }),
        }))
      : [];

  // buy approve calls - consolidate by (token, spender)
  const buyApproveByKey = new Map<
    string,
    { token: Address; spender: Address; amount: bigint }
  >();
  for (const quote of buyQuotes) {
    const token = quote.inputAmount.currency.address! as Address;
    const spender = quote.approveAddress as Address;
    const amount = parseUnits(quote.maximumAmountIn().toExact(), DECIMALS);
    const key = `${token}-${spender}`;
    const existing = buyApproveByKey.get(key);
    buyApproveByKey.set(key, {
      token,
      spender,
      amount: existing ? existing.amount + amount : amount,
    });
  }
  const buyApproveCalls = [...buyApproveByKey.values()].map(
    ({ token, spender, amount }) => ({
      to: token,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
      }),
    }),
  );

  return {
    sellApproveCalls,
    mergeApproveCalls,
    buyApproveCalls,
  };
};

async function getTradeExecutorCalls({
  tradeExecutor,
  quoteResult,
  mintAmount,
  seerCreditsSwapQuote,
  outcomes,
}: PredictProps & { outcomes: RiskPricingOutcome[] }) {
  const calls: Call[] = [];

  // Note that mintAmount will be already be offset taking into account the available SeerCredits
  // so if the collateral amount is 10, then 7 can be SeerCredits and then mintAmount will be 3.
  if (seerCreditsSwapQuote) {
    const mintFromSeerCreditsCalls = await getMintFromSeerCreditsCalls(
      tradeExecutor,
      seerCreditsSwapQuote,
    );

    calls.push(...mintFromSeerCreditsCalls);
  }

  // Adds a split call if the user entered an amount to mint
  if (!isUndefined(mintAmount) && mintAmount > 0n) {
    const mintCalls = getSplitFromTradeExecutorCalls({ amount: mintAmount });
    calls.push(...mintCalls);
  }

  const { quotes, mergeAmount } = quoteResult;
  const { sellQuotes, buyQuotes } = quotes;

  const { sellApproveCalls, mergeApproveCalls, buyApproveCalls } =
    await getApproveCalls(
      quoteResult,
      outcomes.map((x) => x.outcomeId),
    );

  const sellSwapTransactions = (
    await Promise.all(
      sellQuotes.map((quote) =>
        quote.swapTransaction({ recipient: tradeExecutor }),
      ),
    )
  ).map((txn) => ({ to: txn.to!, data: txn.data! }));

  calls.push(...sellApproveCalls);
  calls.push(...sellSwapTransactions);

  if (mergeAmount > 0n) {
    calls.push(...mergeApproveCalls);
    calls.push(mergeFromRouter(RISK_PRICING_MARKET_ID, mergeAmount));
  }

  const buySwapTransactions = (
    await Promise.all(
      buyQuotes.map((quote) =>
        quote.swapTransaction({ recipient: tradeExecutor }),
      ),
    )
  ).map((txn) => ({ to: txn.to!, data: txn.data! }));

  calls.push(...buyApproveCalls);
  calls.push(...buySwapTransactions);
  return calls;
}

async function predictRiskOutcomesFromTradeExecutor({
  tradeExecutor,
  quoteResult,
  mintAmount,
  seerCreditsSwapQuote,
  outcomes,
}: PredictProps & { outcomes: RiskPricingOutcome[] }) {
  const calls = await getTradeExecutorCalls({
    tradeExecutor,
    quoteResult,
    mintAmount,
    seerCreditsSwapQuote,
    outcomes,
  });

  const valueCalls = calls.map((call) => ({
    ...call,
    value: call?.value ?? 0n,
  }));

  // try to add a capped buffer, otherwise let wallet estimate the gas
  const publicClient = getPublicClient(config, { chainId: DEFAULT_CHAIN.id });
  const account = getAccount(config);
  const gas =
    publicClient && account?.address
      ? await estimateGasWithBuffer(publicClient, {
          address: tradeExecutor,
          abi: TradeExecutorAbi,
          functionName: "batchValueExecute",
          args: [valueCalls],
          account: account.address,
        })
      : undefined;

  const writePromise = writeContract(config, {
    address: tradeExecutor,
    abi: TradeExecutorAbi,
    functionName: "batchValueExecute",
    args: [valueCalls],
    value: 0n,
    chainId: DEFAULT_CHAIN.id,
    ...(!isUndefined(gas) && { gas }),
  });

  const result = await waitForTransaction(() => writePromise);
  if (!result.status) {
    throw result.error;
  }
  return result;
}

export const useTradeExecutorPredictRiskOutcomes = (
  onSuccess?: () => unknown,
) => {
  const outcomes = useRiskPredictionStore((state) => state.outcomes);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: PredictProps) =>
      predictRiskOutcomesFromTradeExecutor({ ...props, outcomes }),
    onSuccess() {
      onSuccess?.();
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["useTokenBalance"] });
        queryClient.refetchQueries({ queryKey: ["useTokensBalances"] });
      }, 3000);
    },
  });
};
