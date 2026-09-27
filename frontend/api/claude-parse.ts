export interface SellerOption {
  sellerId: string;
  name: string;
  category?: string;
  priceUsdc?: number;
  freshnessSlaSeconds?: number;
}

function parseHeuristically(query: string, availableSellers: SellerOption[]) {
  const q = query.toLowerCase();

  const stopWords = new Set([
    'pool', 'pools', 'high', 'frequency', 'rates', 'data', 'feed', 'feeds',
    'live', 'protocol', 'token', 'tokens', 'state', 'trades', 'floor', 'debt'
  ]);
  let matchedSeller: SellerOption | undefined;
  let highestScore = 0;

  for (const s of availableSellers) {
    const sName = s.name.toLowerCase();
    let score = 0;
    if (q.includes(sName)) score += 100;
    const words = sName.split(/[\s/&-]+/);
    for (const w of words) {
      if (w.length > 2 && !stopWords.has(w) && q.includes(w)) {
        score += w.length;
      }
    }
    if (sName.includes('curve') && (q.includes('virtual price') || q.includes('stableswap') || q.includes('peg') || q.includes('imbalance') || q.includes('3pool') || q.includes('multi-asset'))) score += 35;
    if (sName.includes('aave') && (q.includes('lending') || q.includes('borrow rate') || q.includes('supply apy') || q.includes('reserve liquidity'))) score += 35;
    if (sName.includes('uniswap') && (q.includes('twap') || q.includes('tick') || q.includes('spot tick'))) score += 35;
    if (sName.includes('compound') && (q.includes('comet') || q.includes('collateral') || q.includes('debt utilization') || q.includes('utilization'))) score += 35;
    if (sName.includes('overtime') && (q.includes('sports') || q.includes('sport') || q.includes('moneyline') || q.includes('odds') || q.includes('spread') || q.includes('arbitrage') || q.includes('sportsbook'))) score += 35;
    if (sName.includes('perpl') && (q.includes('derivative') || q.includes('futures') || q.includes('funding velocity') || q.includes('mark price') || q.includes('basis trade'))) score += 35;
    if (sName.includes('kuru') && (q.includes('clob') || q.includes('order book') || q.includes('orderbook') || q.includes('depth'))) score += 35;
    if (sName.includes('monad') && (q.includes('mempool') || q.includes('congestion') || q.includes('sequencer') || q.includes('telemetry'))) score += 35;
    if (sName.includes('seaport') && (q.includes('nft') || q.includes('opensea') || q.includes('floor') || q.includes('collection'))) score += 35;

    if (score > highestScore) {
      highestScore = score;
      matchedSeller = s;
    }
  }

  if (!matchedSeller) {
    return {
      error: "No matching seller found for your request. Please specify a supported seller or dataset (e.g. Kuru, Aave, Uniswap, Perpl, OpenSea, Overtime, Polymarket, Tally, Morpho).",
    };
  }

  let maxPrice: number | undefined;
  const centsMatch = q.match(/(\d+(?:\.\d+)?)\s*cents?/);
  if (centsMatch) {
    maxPrice = parseFloat(centsMatch[1]) / 100;
  } else {
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

  let maxAgeSeconds: number | undefined;
  const ageMatch = q.match(/(?:under|max|less than|within|freshness(?:\s*(?:under|below|floor|of|within|<=?))?)\s*(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i) ||
                   q.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\s*old/i) ||
                   q.match(/(?:freshness|age)\s*(?:floor|of|under|below|within|<=?)?\s*(\d+(?:\.\d+)?)\s*s?\b/i);
  if (ageMatch) {
    maxAgeSeconds = parseFloat(ageMatch[1]);
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { query, availableSellers } = body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing user query text.' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const sellersPromptText = (availableSellers || [])
      .map((s: SellerOption) => `- "${s.name}" (sellerId: ${s.sellerId}, base price: ${s.priceUsdc ?? 0.25} USDC, promised SLA: ${s.freshnessSlaSeconds ?? 10}s)`)
      .join('\n');

    const systemPrompt = `You parse a user's natural-language data request into a structured purchase call. Available datasets and their sellerIds:
${sellersPromptText}

Return ONLY a JSON object matching this schema: { "sellerId": string, "matchedDatasetName": string, "maxPrice": number, "maxAgeSeconds": number }.
Set "sellerId" to "veris.eth" and "matchedDatasetName" to the exact matching dataset name.
If the request is ambiguous, missing a price or freshness limit, or doesn't match any known seller/dataset, return { "error": string } explaining what's missing instead of guessing.
Do NOT include markdown backticks or any explanatory text outside the JSON.`;

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

        if (anthropicRes.ok) {
          const anthropicData = (await anthropicRes.json()) as any;
          const rawText = anthropicData.content?.[0]?.text?.trim() || '{}';
          const cleanedJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
          const parsed = JSON.parse(cleanedJson);
          return res.status(200).json({ ...parsed, provider: 'claude' });
        }
      } catch (err: unknown) {
        console.warn('[Claude API Failed, using fallback parser]:', err);
      }
    }

    const result = parseHeuristically(query, availableSellers || []);
    return res.status(200).json({ ...result, provider: 'local-claude-engine' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
