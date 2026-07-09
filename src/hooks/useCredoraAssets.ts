import { useQuery } from "@tanstack/react-query";

import { RiskAssetData } from "@/consts/markets";

export const useCredoraAssets = () =>
  useQuery<Record<string, RiskAssetData>>({
    queryKey: ["credoraAssets"],
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      fetch("/api/credora").then((res) => (res.ok ? res.json() : {})),
  });
