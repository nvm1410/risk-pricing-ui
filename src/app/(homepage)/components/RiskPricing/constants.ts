import { gnosis, mainnet, optimism, base } from "viem/chains";

export const assetColors = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

type Zone = {
  label: string;
  emoji: string;
  from: number;
  to: number;
  colors: string[];
};

export const zones: Zone[] = [
  {
    label: "SAFE",
    emoji: "😊",
    from: 0,
    to: 3,
    colors: ["#bbf7d0", "#dcfce7"],
  },
  {
    label: "CAUTION",
    emoji: "🙄",
    from: 3,
    to: 5,
    colors: ["#fef9c3", "#fed7aa"],
  },
  {
    label: "WARNING",
    emoji: "😬",
    from: 5,
    to: 10,
    colors: ["#fbcfe8", "#f9a8d4"],
  },
  {
    label: "DANGER",
    emoji: "😱",
    from: 10,
    to: 20,
    colors: ["#f9a8d4", "#fb7185"],
  },
];

export const BLOCK_EXPLORER_URLS: Partial<Record<number, string>> = {
  [gnosis.id]: "https://gnosisscan.io",
  [mainnet.id]: "https://etherscan.io",
  [optimism.id]: "https://optimistic.etherscan.io",
  [base.id]: "https://basescan.org",
};
