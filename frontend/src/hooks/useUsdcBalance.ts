import { useState, useEffect, useCallback, useMemo } from "react";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { createPublicClient, http, formatUnits } from "viem";
import {
  ADDRESSES,
  ERC20_ABI,
  MONAD_TESTNET_RPC,
  MONAD_TESTNET_CHAIN_ID,
} from "../lib/contracts";

export interface UsdcBalanceState {
  usdcBalance: string;
  usdcRaw: bigint;
  monBalance: string;
  monRaw: bigint;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  walletAddress: string | null;
}

export function useUsdcBalance(): UsdcBalanceState {
  const { primaryWallet } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();

  const [usdcRaw, setUsdcRaw] = useState<bigint>(0n);
  const [monRaw, setMonRaw] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = primaryWallet?.address ?? null;

  const publicClient = useMemo(() => {
    return createPublicClient({
      transport: http(MONAD_TESTNET_RPC),
    });
  }, []);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress || !isLoggedIn) {
      setUsdcRaw(0n);
      setMonRaw(0n);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      // 1. Fetch USDC balance (6 decimals)
      const usdcPromise = publicClient.readContract({
        address: ADDRESSES.paymentToken,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      }) as Promise<bigint>;

      // 2. Fetch Native MON balance (18 decimals)
      const monPromise = publicClient.getBalance({
        address: walletAddress as `0x${string}`,
      });

      const [rawUsdc, rawMon] = await Promise.all([usdcPromise, monPromise]);

      setUsdcRaw(rawUsdc);
      setMonRaw(rawMon);
    } catch (err: unknown) {
      console.warn("[Veris useUsdcBalance] Failed to fetch token balances:", err);
      setIsError(true);
      setError(err instanceof Error ? err.message : "Failed to load balance");
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isLoggedIn, publicClient]);

  // Initial fetch and auto-refresh on account switch
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Periodic polling every 12 seconds
  useEffect(() => {
    if (!walletAddress || !isLoggedIn) return;
    const interval = setInterval(() => {
      fetchBalances();
    }, 12000);
    return () => clearInterval(interval);
  }, [walletAddress, isLoggedIn, fetchBalances]);

  const usdcBalance = useMemo(() => {
    if (usdcRaw === 0n) return "0.00";
    const formatted = formatUnits(usdcRaw, 6);
    const num = parseFloat(formatted);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  }, [usdcRaw]);

  const monBalance = useMemo(() => {
    if (monRaw === 0n) return "0.000";
    const formatted = formatUnits(monRaw, 18);
    const num = parseFloat(formatted);
    return isNaN(num) ? "0.000" : num.toFixed(3);
  }, [monRaw]);

  return {
    usdcBalance,
    usdcRaw,
    monBalance,
    monRaw,
    isLoading,
    isError,
    error,
    refetch: fetchBalances,
    walletAddress,
  };
}
