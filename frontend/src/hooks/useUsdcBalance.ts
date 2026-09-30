import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { createPublicClient, http, formatUnits } from "viem";
import {
  ADDRESSES,
  ERC20_ABI,
  MONAD_TESTNET_RPC,
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
  addFunds: (amount: number) => void;
  deductFunds: (amount: number) => void;
  walletAddress: string | null;
}

const DEFAULT_STARTER_BALANCE = 25.0; // 25.00 USDC testnet grant for live testing

export function useUsdcBalance(): UsdcBalanceState {
  // Always register standard state hooks first
  const [usdcRaw, setUsdcRaw] = useState<bigint>(0n);
  const [monRaw, setMonRaw] = useState<bigint>(0n);
  const [sessionBalance, setSessionBalance] = useState<number>(DEFAULT_STARTER_BALANCE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const lastOnChainRawRef = useRef<bigint | null>(null);

  // Dynamic context hooks
  const { primaryWallet } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const walletAddress = primaryWallet?.address ?? null;

  const publicClient = useMemo(() => {
    return createPublicClient({
      transport: http(MONAD_TESTNET_RPC),
    });
  }, []);

  const getStorageKey = useCallback(() => {
    return `veris_balance_${(walletAddress || "guest").toLowerCase()}`;
  }, [walletAddress]);

  // Sync session balance when wallet changes or on mount
  useEffect(() => {
    lastOnChainRawRef.current = null;
    const key = getStorageKey();
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) {
        setSessionBalance(parsed);
        return;
      }
    }
    setSessionBalance(DEFAULT_STARTER_BALANCE);
    localStorage.setItem(key, DEFAULT_STARTER_BALANCE.toFixed(2));
  }, [getStorageKey]);

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
      // 1. Fetch on-chain USDC balance (6 decimals)
      const usdcPromise = publicClient.readContract({
        address: ADDRESSES.paymentToken,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`] as const,
      } as any) as Promise<bigint>;

      // 2. Fetch Native MON balance (18 decimals)
      const monPromise = publicClient.getBalance({
        address: walletAddress as `0x${string}`,
      });

      const [rawUsdc, rawMon] = await Promise.all([usdcPromise, monPromise]);

      setUsdcRaw(rawUsdc);
      setMonRaw(rawMon);

      const onChainUsdc = parseFloat(formatUnits(rawUsdc, 6));
      const key = getStorageKey();
      const existingSaved = localStorage.getItem(key);

      if (lastOnChainRawRef.current === null) {
        lastOnChainRawRef.current = rawUsdc;
        // On initial wallet connection: if no prior saved session balance exists, seed from on-chain
        if (existingSaved === null && rawUsdc > 0n) {
          setSessionBalance(onChainUsdc);
          localStorage.setItem(key, onChainUsdc.toFixed(2));
        }
      } else if (rawUsdc !== lastOnChainRawRef.current) {
        // On-chain balance changed externally (e.g. faucet deposit or on-chain transfer)
        const diffUnits = Number(rawUsdc - lastOnChainRawRef.current) / 1_000_000;
        lastOnChainRawRef.current = rawUsdc;
        setSessionBalance((prev) => {
          const next = Math.max(0, Number((prev + diffUnits).toFixed(4)));
          localStorage.setItem(key, next.toFixed(2));
          return next;
        });
      }
    } catch (err: unknown) {
      console.warn("[Veris useUsdcBalance] Failed to fetch token balances:", err);
      setIsError(true);
      setError(err instanceof Error ? err.message : "Failed to load balance");
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isLoggedIn, publicClient, getStorageKey]);

  // Listen to global balance updates (deduct on buy, refund on breach, add on faucet)
  useEffect(() => {
    const handleBalanceEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: "deduct" | "refund" | "add" | "set"; amount: number }>;
      if (!customEvent.detail) return;
      const { action, amount } = customEvent.detail;

      setSessionBalance((prev) => {
        let next = prev;
        if (action === "deduct") {
          next = Math.max(0, Number((prev - amount).toFixed(4)));
        } else if (action === "refund" || action === "add") {
          next = Number((prev + amount).toFixed(4));
        } else if (action === "set") {
          next = Number(amount.toFixed(4));
        }
        localStorage.setItem(getStorageKey(), next.toFixed(2));
        return next;
      });
    };

    window.addEventListener("veris:balance-update", handleBalanceEvent);
    return () => window.removeEventListener("veris:balance-update", handleBalanceEvent);
  }, [getStorageKey]);

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

  const addFunds = useCallback((amount: number) => {
    window.dispatchEvent(
      new CustomEvent("veris:balance-update", {
        detail: { action: "add", amount },
      })
    );
  }, []);

  const deductFunds = useCallback((amount: number) => {
    window.dispatchEvent(
      new CustomEvent("veris:balance-update", {
        detail: { action: "deduct", amount },
      })
    );
  }, []);

  const usdcBalance = useMemo(() => {
    return sessionBalance.toFixed(2);
  }, [sessionBalance]);

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
    addFunds,
    deductFunds,
    walletAddress,
  };
}
