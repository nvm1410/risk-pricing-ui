import { useQuery } from "@tanstack/react-query";
import { Address, Client, erc20Abi } from "viem";
import { multicall } from "viem/actions";
import { gnosis } from "viem/chains";
import { useClient } from "wagmi";

import { SupportedChain } from "@/types/market-types";

import { isUndefined } from "@/utils";

export interface GetTokenResult {
  address: Address;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
}
export const NATIVE_TOKEN: Address =
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export async function getTokensInfo(
  addresses: Address[],
  chainId: SupportedChain,
  client: Client,
): Promise<GetTokenResult[]> {
  if (addresses.length === 0) {
    return [];
  }

  const nativeName = chainId === gnosis.id ? "xDAI" : "ETH";
  const tokensInfo: Array<GetTokenResult | undefined> = new Array(
    addresses.length,
  );
  const erc20Addresses: Address[] = [];
  const erc20Indexes: number[] = [];

  for (const [index, address] of addresses.entries()) {
    if (address.toLowerCase() === NATIVE_TOKEN.toLowerCase()) {
      tokensInfo[index] = {
        address,
        chainId,
        decimals: 18,
        name: nativeName,
        symbol: nativeName,
      };
      continue;
    }

    erc20Addresses.push(address);
    erc20Indexes.push(index);
  }

  if (erc20Addresses.length > 0) {
    const erc20Results = (await multicall(client, {
      allowFailure: false,
      contracts: erc20Addresses.flatMap((address) => [
        {
          address,
          abi: erc20Abi,
          functionName: "decimals",
        },
        {
          address,
          abi: erc20Abi,
          functionName: "name",
        },
        {
          address,
          abi: erc20Abi,
          functionName: "symbol",
        },
      ]),
    })) as Array<number | string>;

    for (const [erc20Index, address] of erc20Addresses.entries()) {
      const resultOffset = erc20Index * 3;
      const decimals = erc20Results[resultOffset] as number;
      const name = erc20Results[resultOffset + 1] as string;
      const symbol = erc20Results[resultOffset + 2] as string;

      tokensInfo[erc20Indexes[erc20Index]] = {
        address,
        chainId,
        decimals,
        name,
        symbol,
      };
    }
  }

  return tokensInfo as GetTokenResult[];
}

export function useTokensInfo(
  tokens: Address[] | undefined,
  chainId: SupportedChain,
) {
  const client = useClient({ chainId });
  return useQuery<GetTokenResult[] | undefined, Error>({
    enabled: !!client && !isUndefined(tokens) && (tokens?.length ?? 0) > 0,
    queryKey: ["useTokens", tokens, chainId],
    queryFn: async () => {
      const tokensInfo = await getTokensInfo(tokens!, chainId, client!);
      return tokensInfo;
    },
  });
}
