import React, { useMemo } from "react";

import { Tooltip } from "@kleros/ui-components-library";
import clsx from "clsx";
import Link from "next/link";
import { Address } from "viem";

import InfoIcon from "@/assets/svg/info.svg";

import { formatValue, isUndefined } from "@/utils";

import { useRiskTokenPositionValue } from "@/hooks/useRiskTokenPositionValue";
import { riskPositionExplainLink } from "./constants";
import RedeemButton from "./RedeemButton";
import { RiskPricingOutcome } from "@/hooks/useMarketData";

interface IPositionValue {
  outcome: RiskPricingOutcome;
  tradeExecutor: Address;
}

const PositionValue: React.FC<IPositionValue> = ({
  outcome,
  tradeExecutor,
}) => {
  const { outcomeId, collateral, price: marketPrice, symbol } = outcome;
  const isResolved = false;
  const {
    value: totalValue,
    balance,
    price,
  } = useRiskTokenPositionValue(
    outcomeId,
    collateral,
    tradeExecutor ?? "0x",
    marketPrice,
  );

  const displayTotal = useMemo(() => {
    if (totalValue > 0) {
      if (totalValue < 0.01) {
        return "< 0.01";
      } else {
        return totalValue;
      }
    }
    return "0";
  }, [totalValue]);

  if (displayTotal === "0" || marketPrice === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-klerosUIComponentsPrimaryText">
        {isResolved ? (
          <strong>Position to redeem:</strong>
        ) : (
          "Details of your position:"
        )}
      </h3>
      <div
        className={clsx(
          "flex flex-col justify-start gap-4",
          "flex-wrap md:flex-row md:items-center md:justify-center",
        )}
      >
        {!isUndefined(balance) && balance > 0 ? (
          <>
            <p className="text-klerosUIComponentsPrimaryText justify-center text-sm">
              <span className="font-bold">
                {formatValue(balance ?? 0n, 18)} {symbol} &nbsp;
              </span>
              ~{totalValue.toFixed(2)}$ &nbsp;
              <span className="text-klerosUIComponentsSecondaryText text-xs">
                ({price.toFixed(2)}$ per {symbol})
              </span>
            </p>
            <span className="text-klerosUIComponentsPrimaryText justify-center text-sm max-md:hidden">
              {" | "}
            </span>
          </>
        ) : null}

        <Tooltip
          text="Click here to understand your Position"
          small
          delay={0}
          closeDelay={300}
          className="px-2 py-2 [&_small]:text-xs"
        >
          <Link
            href={riskPositionExplainLink}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              "flex items-center gap-1",
              "text-klerosUIComponentsPrimaryText justify-center text-sm",
              "hover:text-klerosUIComponentsPrimaryBlue transition-colors",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            Total:
            <span className="font-bold"> {totalValue.toFixed(2)}$ </span>
            <InfoIcon className="mb-0.25 inline size-3" />
          </Link>
        </Tooltip>
      </div>
      {isResolved ? <RedeemButton tradeExecutor={tradeExecutor!} /> : null}
    </div>
  );
};

export default PositionValue;
