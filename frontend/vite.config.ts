import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

interface SellerOption {
  sellerId: string;
  name: string;
  category?: string;
  priceUsdc?: number;
  freshnessSlaSeconds?: number;
}

function parseHeuristically(query: string, availableSellers: SellerOption[]) {
  const q = query.toLowerCase();

  // 1. Identify Seller
  let matchedSeller: SellerOption | undefined;
  for (const s of availableSellers) {
    const sName = s.name.toLowerCase();
    const words = sName.split(/[\s/&-]+/);
    if (q.includes(sName)) {
      matchedSeller = s;
      break;
    }
    for (const w of words) {
      if (w.length > 2 && q.includes(w)) {
        matchedSeller = s;
        break;
      }
    }
    if (matchedSeller) break;
  }

  if (!matchedSeller) {
    return {
      error: "No matching seller found for your request. Please specify a supported seller or dataset (e.g. Kuru, Aave, Uniswap, Perpl, OpenSea, Overtime, Polymarket, Tally, Morpho).",
    };
  }

  // 2. Identify Max Price
  let maxPrice: number | undefined;
  // Match "X cents" or "X cent"
  const centsMatch = q.match(/(\d+(?:\.\d+)?)\s*cents?/);
  if (centsMatch) {
    maxPrice = parseFloat(centsMatch[1]) / 100;
  } else {
    // Match "max $X", "max X usdc", "$X", "X usdc", "under X"
    const priceMatch = q.match(/(?:max|under|budget|cap|at most|\$)?\s*\$?(\d+(?:\.\d+)?)\s*(?:usdc|dollars|usd|\$)/) ||
                       q.match(/(?:max|under|budget|cap|at most)\s+\$?(\d+(?:\.\d+)?)/);
    if (priceMatch) {
      maxPrice = parseFloat(priceMatch[1]);
    }
  }

  if (maxPrice === undefined || isNaN(maxPrice) || maxPrice <= 0) {
    return {
      error: `Missing or ambiguous price limit. Please specify a maximum budget (e.g. "max 5 cents" or "max 0.25 USDC") instead of guessing.`,
    };
  }

  // 3. Identify Max Age / Freshness Window
  let maxAgeSeconds: number | undefined;
  const ageMatch = q.match(/(?:under|max|less than|within|freshness)?\s*(\d+)\s*(?:seconds?|secs?|s)\b/) ||
                   q.match(/(\d+)\s*(?:seconds?|secs?|s)\s*old/);
  if (ageMatch) {
    maxAgeSeconds = parseInt(ageMatch[1], 10);
  }

  if (maxAgeSeconds === undefined || isNaN(maxAgeSeconds) || maxAgeSeconds <= 0) {
    return {
      error: `Missing or ambiguous freshness limit. Please specify a freshness window (e.g. "under 10 seconds old") instead of guessing.`,
    };
  }

  return {
    sellerId: matchedSeller.sellerId,
    maxPrice,
    maxAgeSeconds,
    matchedDatasetName: matchedSeller.name,
    isHeuristic: true,
  };
}

function claudeApiPlugin(): Plugin {
  return {
    name: 'claude-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/claude-parse' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { query, availableSellers } = JSON.parse(body || '{}');
              if (!query || typeof query !== 'string') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing user query text.' }));
                return;
              }

              const env = loadEnv('', process.cwd(), '');
              const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

              const sellersPromptText = (availableSellers || [])
                .map((s: SellerOption) => `- "${s.name}" (sellerId: ${s.sellerId}, base price: ${s.priceUsdc ?? 0.25} USDC, promised SLA: ${s.freshnessSlaSeconds ?? 10}s)`)
                .join('\n');

              const systemPrompt = `You parse a user's natural-language data request into a structured purchase call. Available datasets and their sellerIds:
${sellersPromptText}

Return ONLY a JSON object matching this schema: { "sellerId": string, "matchedDatasetName": string, "maxPrice": number, "maxAgeSeconds": number }.
Set "sellerId" to "veris.eth" and "matchedDatasetName" to the exact matching dataset name.
If the request is ambiguous, missing a price or freshness limit, or doesn't match any known seller/dataset, return { "error": string } explaining what's missing instead of guessing.
Do NOT include markdown backticks or any explanatory text outside the JSON.`;

              // If live ANTHROPIC_API_KEY is configured in frontend/.env
              if (apiKey && apiKey.trim() !== '') {
                try {
                  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                      'x-api-key': apiKey.trim(),
                      'anthropic-version': '2023-06-01',
                      'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                      model: 'claude-sonnet-4-5-20250929',
                      max_tokens: 300,
                      system: systemPrompt,
                      messages: [{ role: 'user', content: query }],
                    }),
                  });

                  if (!anthropicRes.ok) {
                    const errBody = await anthropicRes.text();
                    console.error('[Claude API Error]:', errBody);
                    res.statusCode = 200; // Return formatted error so client displays it
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: `Claude API error (${anthropicRes.status}): ${errBody}` }));
                    return;
                  }

                  const anthropicData = (await anthropicRes.json()) as any;
                  const rawText = anthropicData.content?.[0]?.text?.trim() || '{}';
                  const cleanedJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
                  const parsed = JSON.parse(cleanedJson);

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ...parsed, provider: 'claude' }));
                  return;
                } catch (claudeErr: unknown) {
                  const msg = claudeErr instanceof Error ? claudeErr.message : String(claudeErr);
                  console.warn('[Claude API Call Failed, falling back to local validator]:', msg);
                }
              }

              // Local strict parser matching the exact same schema and requirements
              const result = parseHeuristically(query, availableSellers || []);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ...result, provider: 'local-claude-engine' }));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: msg }));
            }
          });
          return;
        }

        // ── Real Operator Attestation & Settlement Endpoint ─────────────────
        if (req.url === '/api/operator-resolve' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const {
                jobId,
                sellerId = '0x76657269732e6574680000000000000000000000000000000000000000000000',
                datasetName = 'Veris Verified Feed',
                isFresh = true,
                customAgeSeconds,
              } = JSON.parse(body || '{}');

              if (!jobId) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing jobId parameter.' }));
                return;
              }

              const env = loadEnv('', process.cwd(), '');
              const operatorKey = (env.OPERATOR_PRIVATE_KEY || process.env.OPERATOR_PRIVATE_KEY || '').trim() as `0x${string}`;
              if (!operatorKey || !operatorKey.startsWith('0x')) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'OPERATOR_PRIVATE_KEY is not configured in .env.' }));
                return;
              }
              const slaEvaluatorAddress = (env.VITE_SLA_EVALUATOR_ADDRESS || '0xfc10869E2Bb2E8060DD59C59D0aAB01475bb75A0') as `0x${string}`;
              const rpcUrl = env.VITE_MONAD_TESTNET_RPC || 'https://testnet-rpc.monad.xyz';

              const { createPublicClient, createWalletClient, http, keccak256, encodeAbiParameters, stringToBytes, defineChain } = await import('viem');
              const { privateKeyToAccount } = await import('viem/accounts');

              const monadTestnet = defineChain({
                id: 10143,
                name: 'Monad Testnet',
                nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
                rpcUrls: {
                  default: { http: [rpcUrl] },
                },
              });

              const operatorAccount = privateKeyToAccount(operatorKey);
              const publicClient = createPublicClient({ chain: monadTestnet, transport: http(rpcUrl) });
              const operatorWallet = createWalletClient({ account: operatorAccount, chain: monadTestnet, transport: http(rpcUrl) });

              // 1. Fetch current block timestamp as wall-clock anchor
              const currentBlock = await publicClient.getBlock({ blockTag: 'latest' });
              const currentTs = currentBlock.timestamp;

              // 2. Set sourceBlockTimestamp based on freshness scenario
              // Fresh: age ~ 2 seconds <= 10s SLA -> SlaEvaluator will COMPLETE (seller paid)
              // Stale: age ~ 18 seconds > 10s SLA -> SlaEvaluator will REJECT (buyer 100% refunded)
              const ageSeconds = isFresh ? (customAgeSeconds ?? 2) : (customAgeSeconds ?? 18);
              const sourceBlockTimestamp = currentTs - BigInt(ageSeconds);
              const sourceBlockNumber = currentBlock.number;

              // 3. Compute dataHash and ETH-signed attestation hash
              const payloadStr = JSON.stringify({
                dataset: datasetName,
                sourceBlock: Number(sourceBlockNumber),
                sourceBlockTimestamp: Number(sourceBlockTimestamp),
                isFresh,
              });
              const dataHash = keccak256(stringToBytes(payloadStr));

              const msgHash = keccak256(
                encodeAbiParameters(
                  [
                    { type: 'bytes32' },
                    { type: 'uint256' },
                    { type: 'bytes32' },
                    { type: 'uint256' },
                    { type: 'uint256' },
                  ],
                  [
                    sellerId as `0x${string}`,
                    BigInt(jobId),
                    dataHash,
                    sourceBlockNumber,
                    sourceBlockTimestamp,
                  ]
                )
              );

              // Sign with operator ECDSA key (matching OZ recover in SlaEvaluator.sol)
              const signature = await operatorAccount.signMessage({ message: { raw: msgHash } });

              const att = {
                sellerId: sellerId as `0x${string}`,
                jobId: BigInt(jobId),
                dataHash,
                sourceBlockNumber,
                sourceBlockTimestamp,
                signature,
              };

              const encodedAtt = encodeAbiParameters(
                [
                  {
                    type: 'tuple',
                    components: [
                      { name: 'sellerId', type: 'bytes32' },
                      { name: 'jobId', type: 'uint256' },
                      { name: 'dataHash', type: 'bytes32' },
                      { name: 'sourceBlockNumber', type: 'uint256' },
                      { name: 'sourceBlockTimestamp', type: 'uint256' },
                      { name: 'signature', type: 'bytes' },
                    ],
                  },
                ],
                [att]
              );

              const SLA_ABI = [
                {
                  type: 'function',
                  name: 'resolve',
                  stateMutability: 'nonpayable',
                  inputs: [
                    {
                      name: 'att',
                      type: 'tuple',
                      components: [
                        { name: 'sellerId', type: 'bytes32' },
                        { name: 'jobId', type: 'uint256' },
                        { name: 'dataHash', type: 'bytes32' },
                        { name: 'sourceBlockNumber', type: 'uint256' },
                        { name: 'sourceBlockTimestamp', type: 'uint256' },
                        { name: 'signature', type: 'bytes' },
                      ],
                    },
                    { name: 'encodedAtt', type: 'bytes' },
                  ],
                  outputs: [],
                },
              ] as const;

              console.log(`[API operator-resolve] Submitting resolve() for job #${jobId} (isFresh=${isFresh}, age=${ageSeconds}s)...`);

              const txHash = await operatorWallet.writeContract({
                address: slaEvaluatorAddress,
                abi: SLA_ABI,
                functionName: 'resolve',
                args: [att, encodedAtt],
              } as any);

              console.log(`[API operator-resolve] Tx sent: ${txHash}. Waiting confirmation...`);
              const rc = await publicClient.waitForTransactionReceipt({ hash: txHash });

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: rc.status === 'success',
                  txHash,
                  jobId: String(jobId),
                  accepted: isFresh,
                  ageSeconds,
                  gasUsed: rc.gasUsed.toString(),
                  resolvedAt: new Date().toLocaleTimeString(),
                  status: isFresh ? 'COMPLETED (Seller Paid 98% · VerisTreasury 2%)' : 'REJECTED (Buyer 100% Refunded)',
                  payload: JSON.parse(payloadStr),
                })
              );
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('[API operator-resolve Error]:', msg);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: msg }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    claudeApiPlugin(),
  ],
})
