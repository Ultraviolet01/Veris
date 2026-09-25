/**
 * dynamic.tsx — Dynamic SDK Provider Configuration
 *
 * Configures:
 *   - Monad Testnet (Chain ID 10143) as custom EVM network
 *   - EthereumWalletConnectors for embedded/WaaS wallets
 *   - mergeNetworks to preserve dashboard configs while ensuring Monad 10143 is present
 *   - Custom dark theme matching Veris aesthetics
 */

import React from "react";
import { DynamicContextProvider, mergeNetworks } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { MONAD_TESTNET_EVM } from "./contracts";

// Active Dynamic Environment ID
const DEFAULT_DYNAMIC_ENV_ID = "09916562-4338-4a1e-9dd6-2f4dc1e0e80d";

const ENVIRONMENT_ID =
  import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || DEFAULT_DYNAMIC_ENV_ID;

export function DynamicProvider({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      theme="dark"
      settings={{
        environmentId: ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          // Explicitly register Monad Testnet (Chain ID 10143)
          evmNetworks: (networks) => mergeNetworks([MONAD_TESTNET_EVM as never], networks),
        },
        social: {
          strategy: "popup",
        },
        events: {
          onAuthSuccess: async (args) => {
            console.log("[Veris Dynamic] Auth success:", args.user?.userId);
          },
          onLogout: () => {
            console.log("[Veris Dynamic] User logged out");
          },
        },
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
