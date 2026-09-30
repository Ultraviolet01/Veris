import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  encodeAbiParameters,
  stringToBytes,
  defineChain,
  parseAbi,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { fetchRealLivePayload } from './purchase';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      jobId,
      sellerId = '0x76657269732e6574680000000000000000000000000000000000000000000000',
      datasetName = 'Veris Verified Feed',
      isFresh = true,
      customAgeSeconds,
      param1,
      param2,
    } = body;

    if (!jobId) {
      return res.status(400).json({ error: 'Missing jobId parameter.' });
    }

    const operatorKey = (
      process.env.OPERATOR_PRIVATE_KEY ||
      '0x57b45bb6dd6a5369a549ab7e63631cbad11cb821724163d851c3d8c09882b786'
    ).trim() as `0x${string}`;

    if (!operatorKey || !operatorKey.startsWith('0x')) {
      return res.status(500).json({ error: 'OPERATOR_PRIVATE_KEY is not configured in Vercel environment.' });
    }

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

    const ageSeconds = isFresh ? (customAgeSeconds ?? 1.8) : (customAgeSeconds ?? 18);
    const livePayload = await fetchRealLivePayload(datasetName || 'Kuru CLOB', ageSeconds, 10, param1, param2);
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
          BigInt(jobId),
          dataHash,
          sourceBlockNumber,
          sourceBlockTimestamp,
        ]
      )
    );

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

    const slaAbi = parseAbi([
      'function resolve((bytes32 sellerId, uint256 jobId, bytes32 dataHash, uint256 sourceBlockNumber, uint256 sourceBlockTimestamp, bytes signature) att, bytes calldata encodedAtt) external',
    ]);

    const txHash = await operatorWallet.writeContract({
      address: slaEvaluatorAddress,
      abi: slaAbi,
      functionName: 'resolve',
      args: [att, encodedAtt],
    });

    const rc = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return res.status(200).json({
      success: rc.status === 'success',
      txHash,
      jobId: String(jobId),
      accepted: isFresh,
      ageSeconds,
      gasUsed: rc.gasUsed.toString(),
      resolvedAt: new Date().toLocaleTimeString(),
      status: isFresh ? 'COMPLETED (Seller Paid 98% · VerisTreasury 2%)' : 'REJECTED (Buyer 100% Refunded)',
      payload: livePayload,
      realPayload: livePayload,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[API operator-resolve Error]:', msg);
    return res.status(500).json({ error: msg });
  }
}
