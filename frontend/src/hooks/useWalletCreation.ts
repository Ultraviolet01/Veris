/**
 * useWalletCreation.ts — Explicit embedded wallet creation after sign-in
 *
 * Confirmed Dynamic Flow:
 *   1. User completes sign-in (social/passkey/email).
 *   2. The embedded wallet is NOT created purely automatically.
 *   3. Code explicitly calls getChainsMissingWaasWalletAccounts() to inspect missing chains.
 *   4. Calls createWaasWalletAccounts({ chains: [...] }) and awaits completion.
 *   5. Retrieves the created wallet via getWalletAccounts() or Dynamic primaryWallet.
 *   6. Switches network to Monad Testnet (10143) via switchActiveNetwork().
 *   7. Catches NetworkNotAddedError and calls addNetwork() first, then switches.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import {
  createWaasWalletAccounts,
  getChainsMissingWaasWalletAccounts,
} from "@dynamic-labs-sdk/client/waas";
import {
  switchActiveNetwork,
  addNetwork,
  NetworkNotAddedError,
  getWalletAccounts,
  type WalletAccount,
} from "@dynamic-labs-sdk/client";
import { MONAD_TESTNET_CHAIN_ID, MONAD_TESTNET_NETWORK_DATA } from "../lib/contracts";

export type WalletCreationStatus =
  | "idle"
  | "checking"
  | "creating"
  | "switching_network"
  | "ready"
  | "error";

export function useWalletCreation() {
  const { primaryWallet, user, network } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();
  const [status, setStatus] = useState<WalletCreationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeWallet, setActiveWallet] = useState<WalletAccount | null>(null);
  const inProgressRef = useRef(false);

  const isMonadNetwork =
    Number(network) === MONAD_TESTNET_CHAIN_ID ||
    Number(primaryWallet?.additionalAddresses?.find(() => true) ?? 0) === MONAD_TESTNET_CHAIN_ID;

  const createAndSwitch = useCallback(async () => {
    if (inProgressRef.current) return;
    inProgressRef.current = true;
    setError(null);

    try {
      setStatus("checking");
      console.log("[Veris] Checking embedded wallet status...");

      // ── Step 1: Check and create missing WaaS wallet accounts ─────────
      let missingChains: ReturnType<typeof getChainsMissingWaasWalletAccounts> = [];
      try {
        missingChains = getChainsMissingWaasWalletAccounts();
      } catch (checkErr) {
        console.warn("[Veris] getChainsMissingWaasWalletAccounts fallback:", checkErr);
      }

      // If user is authenticated and missing EVM embedded wallet
      if (missingChains.length > 0 || !primaryWallet?.address) {
        setStatus("creating");
        console.log("[Veris] Explicitly calling createWaasWalletAccounts for chains:", missingChains.length > 0 ? missingChains : ["EVM"]);
        
        try {
          await createWaasWalletAccounts({
            chains: missingChains.length > 0 ? missingChains : (["EVM"] as never),
          });
          console.log("[Veris] createWaasWalletAccounts succeeded.");
        } catch (waasErr: unknown) {
          const msg = waasErr instanceof Error ? waasErr.message : String(waasErr);
          // If already created, in progress, or managed by React SDK provider, continue gracefully
          if (
            !msg.includes("already exists") &&
            !msg.includes("in progress") &&
            !msg.includes("No Dynamic client has been created yet")
          ) {
            console.error("[Veris] createWaasWalletAccounts error:", msg);
            throw waasErr;
          }
        }
      }

      // ── Step 2: Retrieve wallet accounts ──────────────────────────────
      let accounts: WalletAccount[] = [];
      try {
        accounts = getWalletAccounts();
      } catch (getAccountsErr) {
        console.warn("[Veris] getWalletAccounts read:", getAccountsErr);
      }

      const evmAccount = accounts.find((a) => a.chain === "EVM") || accounts[0] || null;
      if (evmAccount) {
        setActiveWallet(evmAccount);
      }

      // ── Step 3: Switch active network to Monad Testnet (10143) ────────
      if (evmAccount) {
        setStatus("switching_network");
        console.log("[Veris] Switching active network to Monad Testnet (10143)...");
        try {
          await switchActiveNetwork({
            walletAccount: evmAccount,
            networkId: String(MONAD_TESTNET_CHAIN_ID),
          });
          console.log("[Veris] Successfully switched to Monad Testnet!");
        } catch (switchErr: unknown) {
          if (switchErr instanceof NetworkNotAddedError) {
            console.log("[Veris] Monad Testnet not added yet — calling addNetwork first...");
            await addNetwork({
              walletAccount: evmAccount,
              networkData: MONAD_TESTNET_NETWORK_DATA,
            });
            console.log("[Veris] addNetwork succeeded. Retrying switchActiveNetwork...");
            await switchActiveNetwork({
              walletAccount: evmAccount,
              networkId: String(MONAD_TESTNET_CHAIN_ID),
            });
            console.log("[Veris] Active network set to Monad Testnet (10143).");
          } else {
            console.warn("[Veris] switchActiveNetwork note:", switchErr);
          }
        }
      }

      setStatus("ready");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Veris] useWalletCreation error:", msg);
      setError(msg);
      setStatus("error");
    } finally {
      inProgressRef.current = false;
    }
  }, [primaryWallet?.address]);

  // Trigger wallet creation whenever user signs in
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setStatus("idle");
      setActiveWallet(null);
      return;
    }

    if (status === "idle") {
      void createAndSwitch();
    }
  }, [isLoggedIn, user, status, createAndSwitch]);

  return {
    status,
    error,
    activeWallet,
    walletAddress: primaryWallet?.address || activeWallet?.address || null,
    isMonadNetwork,
    retry: createAndSwitch,
  };
}
