import { fetchRealLivePayload } from '../src/lib/realDataFetcher';
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseUnits,
  keccak256,
  encodeAbiParameters,
  stringToBytes,
  defineChain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      datasetName = 'Kuru CLOB Order Book Depth',
      sellerId = '0x76657269732e6574680000000000000000000000000000000000000000000000',
      budgetUsdc = 0.25,
      freshnessSlaSeconds = 10,
      param1,
      param2,
      isFresh = true,
      customAgeSeconds,
    } = body;

    const operatorKey = (process.env.OPERATOR_PRIVATE_KEY || '').trim() as `0x${string}`;
    if (!operatorKey || !operatorKey.startsWith('0x')) {
      return res.status(500).json({ error: 'OPERATOR_PRIVATE_KEY is not configured in Vercel environment.' });
    }

    const acpCoreAddress = (process.env.VITE_ACP_CORE_ADDRESS || '0x5898d78653C1f691431A045580c1b1D6aFC28AF9') as `0x${string}`;
    const slaEvaluatorAddress = (process.env.VITE_SLA_EVALUATOR_ADDRESS || '0xfc10869E2Bb2E8060DD59C59D0aAB01475bb75A0') as `0x${string}`;
    const rpcUrl = process.env.VITE_MONAD_TESTNET_RPC || 'https://testnet-rpc.monad.xyz';

    const monadTestnet = defineChain({
      id: 10143,
      name: 'Monad Testnet',
      nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    });

    const operatorAccount = privateKeyToAccount(operatorKey);
    const publicClient = createPublicClient({ chain: monadTestnet, transport: http(rpcUrl) });
    const operatorWallet = createWalletClient({ account: operatorAccount, chain: monadTestnet, transport: http(rpcUrl) });

    const budgetWei = parseUnits(budgetUsdc.toString(), 6);
    const expiredAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    const acpAbi = parseAbi([
      'function createJob(address provider, address evaluator, uint256 expiredAt, string calldata description, address hook) external returns (uint256 jobId)',
      'function setBudget(uint256 jobId, uint256 amount, bytes calldata optParams) external',
      'function fund(uint256 jobId, uint256 expectedBudget, bytes calldata optParams) external',
    ]);

    // 1. Create Job on ACPCore
    const txCreate = await operatorWallet.writeContract({
      address: acpCoreAddress,
      abi: acpAbi,
      functionName: 'createJob',
      args: [slaEvaluatorAddress, slaEvaluatorAddress, expiredAt, `Veris Feed: ${datasetName}`, slaEvaluatorAddress],
    });
    const rcCreate = await publicClient.waitForTransactionReceipt({ hash: txCreate });
    let jobId = 0n;
    for (const log of rcCreate.logs) {
      if (log.address.toLowerCase() === acpCoreAddress.toLowerCase() && log.topics[1]) {
        jobId = BigInt(log.topics[1]);
        break;
      }
    }
    if (jobId === 0n) jobId = BigInt(Date.now());

    // 2. Set Budget on ACPCore
    const txBudget = await operatorWallet.writeContract({
      address: acpCoreAddress,
      abi: acpAbi,
      functionName: 'setBudget',
      args: [jobId, budgetWei, '0x'],
    });
    await publicClient.waitForTransactionReceipt({ hash: txBudget });

    // 3. Fund Job
    const txFund = await operatorWallet.writeContract({
      address: acpCoreAddress,
      abi: acpAbi,
      functionName: 'fund',
      args: [jobId, budgetWei, '0x'],
    });
    await publicClient.waitForTransactionReceipt({ hash: txFund });

    // 4. Time breach evaluation
    const baselineArrivalAge = 1.8;
    const requestedSla = Number(freshnessSlaSeconds);
    const isTimeBreached = baselineArrivalAge > requestedSla;
    const actuallyFresh = isFresh && !isTimeBreached;

    const effectiveOnChainAge = actuallyFresh
      ? (customAgeSeconds ?? baselineArrivalAge)
      : (customAgeSeconds ?? Math.max(baselineArrivalAge, requestedSla + 4.5, 14.0));

    const reportedDataAge = isTimeBreached ? baselineArrivalAge : effectiveOnChainAge;

    const livePayload = await fetchRealLivePayload(datasetName, effectiveOnChainAge, requestedSla, param1, param2);
    const sourceBlockNumber = BigInt(livePayload.sourceBlockNumber);
    const sourceBlockTimestamp = BigInt(livePayload.sourceBlockTimestamp);

    const payloadStr = JSON.stringify(livePayload);
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
          jobId,
          dataHash,
          sourceBlockNumber,
          sourceBlockTimestamp,
        ]
      )
    );

    const signature = await operatorAccount.signMessage({ message: { raw: msgHash } });

    const att = {
      sellerId: sellerId as `0x${string}`,
      jobId,
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

    const txResolve = await operatorWallet.writeContract({
      address: slaEvaluatorAddress,
      abi: SLA_ABI,
      functionName: 'resolve',
      args: [att, encodedAtt],
    } as any);
    await publicClient.waitForTransactionReceipt({ hash: txResolve });

    const finalStatus = actuallyFresh ? 'SLA Met' : 'Refunded';
    const verdict = actuallyFresh ? 'APPROVED' : 'REFUNDED';
    const outcome = actuallyFresh ? 'settled' : 'refunded';

    return res.status(200).json({
      success: true,
      jobId: jobId.toString(),
      txCreate,
      txSetBudget: txBudget,
      txFund,
      txResolve,
      budgetUsdc,
      datasetName,
      freshnessSlaSeconds,
      status: finalStatus,
      verdict,
      outcome,
      dataAgeSeconds: reportedDataAge,
      sellerAmountUsdc: actuallyFresh ? Number((budgetUsdc * 0.98).toFixed(4)) : 0,
      treasuryAmountUsdc: actuallyFresh ? Number((budgetUsdc * 0.02).toFixed(4)) : 0,
      resolvedAt: new Date().toLocaleTimeString(),
      operatorAddress: operatorAccount.address,
      blockHeight: Number(sourceBlockNumber),
      signature,
      realPayload: livePayload,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
