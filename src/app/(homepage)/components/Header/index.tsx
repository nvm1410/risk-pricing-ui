import { Tooltip } from "@kleros/ui-components-library";
import clsx from "clsx";
import { format } from "date-fns";
import Image from "next/image";

import SeerLogo from "@/components/SeerLogo";

import HelpIcon from "@/assets/menu-icons/help.svg";
import SeerHeaderBackground from "@/assets/png/seer-header-bg.png";
import ChartBar from "@/assets/svg/chart-bar.svg";

import { endTime, marketMetadata } from "@/consts/markets";

import Countdown from "./Countdown";

const defaultDefinition = (
  <>
    Default according to Risk Pricing definition includes:
    <br />• <span className="font-bold">Redemption Failure:</span> inability to
    redeem the asset at expected value for 2 weeks
    <br />• <span className="font-bold">Reserve Insolvency:</span> reserves fall
    1% below issuance value for 7+ days
    <br />• <span className="font-bold">Other structural failures</span>{" "}
    relevant to token mechanics (wrapped assets, LSTs, fiat-backed stablecoins)
  </>
) as unknown as string;

const Header: React.FC = () => {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-klerosUIComponentsPrimaryText text-2xl font-semibold">
        {marketMetadata.name}
      </h1>
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <ChartBar className="size-3.5" />
          <span className="text-klerosUIComponentsSecondaryText text-sm">
            Trading Period:
          </span>
          <span className="text-klerosUIComponentsPrimaryText text-sm font-semibold">
            Until {format(endTime, "EEEE do MMMM HH:mm 'UTC'")}
          </span>
        </div>
        <Countdown />
      </div>

      <div
        className={clsx(
          "relative mt-8 box-border w-full overflow-hidden rounded-xl",
          "border-gradient-purple-blue",
          "flex flex-col gap-2",
        )}
      >
        <Image
          src={SeerHeaderBackground}
          alt="Seer header background"
          className="absolute -z-2 size-full object-cover max-md:opacity-35"
        />
        <div className="flex size-full flex-wrap items-center gap-6 px-6 pt-3.75">
          <SeerLogo />
          <p className="text-klerosUIComponentsPrimaryText text-base">
            What is the Probability of{" "}
            <Tooltip
              text={defaultDefinition}
              place="bottom"
              wrapperProps={{ className: "inline-flex items-center" }}
              className="max-w-94 [&>small]:text-sm"
            >
              <span className="cursor-help border-b border-dotted border-current">
                Default (PD)
              </span>
              <HelpIcon className="ml-1 inline-block size-3.5" />
            </Tooltip>{" "}
            for the following DeFi assets before 2027?
          </p>
        </div>
        <p className="text-klerosUIComponentsSecondaryText px-6 pb-3.75 text-xs whitespace-pre-line">
          What is the probability? Estimate the risk level of the following
          protocols.
        </p>
      </div>
    </div>
  );
};
export default Header;
