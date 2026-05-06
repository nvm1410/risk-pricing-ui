import clsx from "clsx";
import Papa from "papaparse";

import { useRiskPredictionStore } from "@/store/riskMarketStore";

import LightButton from "@/components/LightButton";

import DownloadIcon from "@/assets/svg/download.svg";

import { downloadCsvFile } from "@/utils/csv";

const CsvDownload: React.FC = () => {
  const outcomes = useRiskPredictionStore((state) => state.outcomes);
  const predictions = useRiskPredictionStore((state) => state.riskPredictions);
  const handleDownload = () => {
    const data = outcomes.slice(0, -1).map((outcome) => {
      return {
        asset: outcome.outcome,
        probability: predictions[outcome.outcomeId] ?? outcome.probability,
      };
    });

    const csv = Papa.unparse(data, {
      columns: ["asset", "probability"],
    });
    downloadCsvFile(
      `risk-pricing-predictions-${new Date().toUTCString()}.csv`,
      csv,
    );
  };

  return (
    <LightButton
      text="Download CSV Template"
      onPress={handleDownload}
      small
      className={clsx(
        "flex-row-reverse p-0",
        "[&_.button-text]:text-klerosUIComponentsPrimaryBlue [&_.button-text]:text-sm [&_.button-text]:font-normal",
        "hover:bg-klerosUIComponentsWhiteBackground",
      )}
      icon={
        <DownloadIcon className="[&_path]:fill-klerosUIComponentsPrimaryBlue! ml-2" />
      }
    />
  );
};

export default CsvDownload;
