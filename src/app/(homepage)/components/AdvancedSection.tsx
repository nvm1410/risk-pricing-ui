import { Card } from "@kleros/ui-components-library";
import clsx from "clsx";
import Link from "next/link";

import SeerLogo from "@/components/SeerLogo";

import ExternalArrow from "@/assets/svg/external-arrow.svg";
import Download from "@/assets/svg/download.svg";

const AdvancedSection: React.FC = () => {
  return (
    <Card
      round
      className={clsx(
        "border-gradient-purple-blue mb-42 h-auto w-full border-none px-4 py-6 md:px-8",
        "flex flex-col-reverse items-start justify-center gap-x-8 gap-y-4",
        "md:flex-row md:items-center md:justify-between",
      )}
    >
      <div className="flex flex-col items-start gap-2">
        <h3 className="text-klerosUIComponentsPrimaryText text-base font-semibold">
          Advanced
        </h3>
        <p className="text-klerosUIComponentsSecondaryText text-sm">
          Check the opportunities if you want to LP or Trade specific outcome
          tokens in Seer.&nbsp;
          <Link
            href={
              "https://app.seer.pm/markets/100/which-movies-will-clement-watch-as-part-of-the-distilled-clements-judgement-expe-2"
            }
            target="_blank"
            rel="noreferrer noopener"
            className="text-klerosUIComponentsPrimaryBlue items-center text-sm"
          >
            Check it out <ExternalArrow className="ml-2 inline size-4" />
          </Link>
        </p>
        <p className="text-klerosUIComponentsSecondaryText text-sm">
          Download the latest data (updated in the last 24 hours) for the 9
          properties in CSV format.&nbsp;
          <Link
            href={
              "https://app.seer.pm/markets/100/which-movies-will-clement-watch-as-part-of-the-distilled-clements-judgement-expe-2"
            }
            target="_blank"
            rel="noreferrer noopener"
            className="text-klerosUIComponentsPrimaryBlue items-center text-sm"
          >
            here <Download className="ml-2 inline size-4" />
          </Link>
        </p>
      </div>
      <SeerLogo className="shrink-0" />
    </Card>
  );
};
export default AdvancedSection;
