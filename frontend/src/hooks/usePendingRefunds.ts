import { useState, useEffect, useCallback, useMemo } from "react";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { createPublicClient, http, formatUnits, encodeFunctionData, type WalletClient } from "viem";
import {
  ADDRESSES,
  ACP_CORE_ABI,
  BUYER_ROUTER_ABI,
  MONAD_TESTNET_RPC,
  MONAD_TESTNET_CHAIN_ID,
} from "../lib/contracts";

export interface PendingRefundJob {
  jobId: string;
  budgetUsdc: number;
  status: "Rejected" | "Expired";
  datasetName?: string;
}

const CLAIMED_REFUNDS_KEY = "veris_claimed_refunds";

export function getClaimedRefunds(): string[] {
  try {
    const raw = localStorage.getItem(CLAIMED_REFUNDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markRefundClaimed(jobId: string): void {
  try {
    const claimed = getClaimedRefunds();
    if (!claimed.includes(jobId)) {
      claimed.push(jobId);
      localStorage.setItem(CLAIMED_REFUNDS_KEY, JSON.stringify(claimed));
    }
  } catch {}
}

export function isRefundClaimed(jobId: string): boolean {
  return getClaimedRefunds().includes(jobId);
}

export function usePendingRefunds() {
  const { primaryWallet } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const walletAddress = primaryWallet?.address ?? null;

  const [pendingRefunds, setPendingRefunds] = useState<PendingRefundJob[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const publicClient = useMemo(() => {
    return createPublicClient({
      transport: http(MONAD_TESTNET_RPC),
    });
  }, []);

  const scanPendingRefunds = useCallback(async () => {
    if (!walletAddress || !isLoggedIn) {
      setPendingRefunds([]);
      return;
    }

    setIsScanning(true);
    setClaimError(null);

    try {
      const userAddr = walletAddress.toLowerCase();
      const claimedList = getClaimedRefunds();

      // Read total jobs count from ACPCore
      const totalJobsBig = (await publicClient.readContract({
        address: ADDRESSES.acpCore,
        abi: ACP_CORE_ABI,
        functionName: "jobCount",
      } as any)) as bigint;

      const totalJobs = Number(totalJobsBig);
      if (totalJobs <= 0) {
        setPendingRefunds([]);
        return;
      }

      // Collect potential job IDs:
      // 1) From localStorage job history
      const savedMapRaw = localStorage.getItem("veris_job_datasets_map");
      const savedMap: Record<string, string> = savedMapRaw ? JSON.parse(savedMapRaw) : {};
      const savedJobIds = Object.keys(savedMap);

      // 2) Scan recent jobs (last 60 jobs) on-chain
      const startScan = Math.max(1, totalJobs - 60);
      const candidates = new Set<string>();

      for (let i = startScan; i <= totalJobs; i++) {
        candidates.add(i.toString());
      }
      for (const id of savedJobIds) {
        candidates.add(id);
      }

      const results: PendingRefundJob[] = [];

      for (const jobIdStr of Array.from(candidates)) {
        if (claimedList.includes(jobIdStr)) {
          continue; // Already claimed locally
        }

        try {
          const jobId = BigInt(jobIdStr);

          // Check if user is the recorded buyer on BuyerRouter
          const buyer = (await publicClient.readContract({
            address: ADDRESSES.buyerRouter,
            abi: BUYER_ROUTER_ABI,
            functionName: "buyerOf",
            args: [jobId],
          } as any)) as string;

          if (buyer.toLowerCase() !== userAddr) {
            continue;
          }

          // Check status on ACPCore
          const job = (await publicClient.readContract({
            address: ADDRESSES.acpCore,
            abi: ACP_CORE_ABI,
            functionName: "getJob",
            args: [jobId],
          } as any)) as {
            budget: bigint;
            status: number;
          };

          // 4 = Rejected, 5 = Expired
          if (job && (job.status === 4 || job.status === 5)) {
            const budgetUsdc = parseFloat(formatUnits(job.budget, 6));
            if (budgetUsdc > 0) {
              results.push({
                jobId: jobIdStr,
                budgetUsdc,
                status: job.status === 4 ? "Rejected" : "Expired",
                datasetName: savedMap[jobIdStr],
              });
            }
          }
        } catch {
          // Skip invalid jobId
        }
      }

      setPendingRefunds(results);
    } catch (err: unknown) {
      console.warn("[usePendingRefunds] Scan error:", err);
    } finally {
      setIsScanning(false);
    }
  }, [walletAddress, isLoggedIn, publicClient]);

  // Initial scan and refresh on wallet change
  useEffect(() => {
    scanPendingRefunds();
  }, [scanPendingRefunds]);

  // Claim a single refund
  const claimSingleRefund = useCallback(
    async (jobIdStr: string): Promise<string> => {
      if (!primaryWallet) {
        throw new Error("No connected wallet");
      }

      setIsClaiming(true);
      setClaimError(null);

      try {
        const walletClient = await (
          primaryWallet as never as {
            getWalletClient: (chainId?: string) => Promise<WalletClient>;
          }
        ).getWalletClient(String(MONAD_TESTNET_CHAIN_ID));

        if (!walletClient || !walletClient.account) {
          throw new Error("Wallet account not accessible");
        }

        const jobId = BigInt(jobIdStr);

        const txHash = await (walletClient.sendTransaction as any)({
          account: walletClient.account,
          chain: walletClient.chain,
          to: ADDRESSES.buyerRouter,
          data: encodeFunctionData({
            abi: BUYER_ROUTER_ABI,
            functionName: "claimRefund",
            args: [jobId],
          } as any),
        });

        console.log(`[usePendingRefunds] claimRefund tx submitted: ${txHash}`);
        await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

        // Mark claimed locally
        markRefundClaimed(jobIdStr);

        // Find claimed job to get budget
        const target = pendingRefunds.find((j) => j.jobId === jobIdStr);
        const amount = target ? target.budgetUsdc : 0;

        // Dispatch balance update
        window.dispatchEvent(
          new CustomEvent("veris:balance-update", {
            detail: { action: "refund", amount, jobId: jobIdStr },
          })
        );

        // Update local list
        setPendingRefunds((prev) => prev.filter((j) => j.jobId !== jobIdStr));

        return txHash;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const shortMsg = (err as any)?.shortMessage || msg;
        setClaimError(shortMsg);
        throw err;
      } finally {
        setIsClaiming(false);
      }
    },
    [primaryWallet, publicClient, pendingRefunds]
  );

  // Claim all pending refunds sequentially
  const claimAllRefunds = useCallback(async (): Promise<string[]> => {
    const txHashes: string[] = [];
    for (const job of pendingRefunds) {
      try {
        const tx = await claimSingleRefund(job.jobId);
        txHashes.push(tx);
      } catch (err) {
        console.error(`[usePendingRefunds] Failed claiming job #${job.jobId}:`, err);
        break; // Stop on user rejection
      }
    }
    return txHashes;
  }, [pendingRefunds, claimSingleRefund]);

  const totalPendingUsdc = useMemo(() => {
    return Number(pendingRefunds.reduce((acc, j) => acc + j.budgetUsdc, 0).toFixed(4));
  }, [pendingRefunds]);

  return {
    pendingRefunds,
    totalPendingUsdc,
    isScanning,
    isClaiming,
    claimError,
    claimSingleRefund,
    claimAllRefunds,
    refetchPending: scanPendingRefunds,
  };
}
