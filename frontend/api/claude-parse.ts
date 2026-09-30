export interface SellerOption {
  sellerId: string;
  name: string;
  category?: string;
  priceUsdc?: number;
  freshnessSlaSeconds?: number;
}

function parseHeuristically(query: string, availableSellers: SellerOption[]) {
  const q = query.toLowerCase();

  // Strict priority protocol keywords
  let matchedSeller: SellerOption | undefined;
  if (q.includes('aave')) {
    matchedSeller = availableSellers.find(s => s.name.toLowerCase().includes('aave'));
  } else if (q.includes('compound') || q.includes('comet')) {
    matchedSeller = availableSellers.find(s => s.name.toLowerCase().includes('compound'));
  } else if (q.includes('kuru') || q.includes('clob')) {
    matchedSeller = availableSellers.find(s => s.name.toLowerCase().includes('kuru'));
  } else if (q.includes('uniswap') || q.includes('twap')) {
    matchedSeller = availableSellers.find(s => s.name.toLowerCase().includes('uniswap'));
  } else if (q.includes('curve') || q.includes('stableswap') || q.includes('3pool')) {
    matchedSeller = availableSellers.find(s => s.name.toLowerCase().includes('curve'));
  } else if (q.includes('pyth') || (q.includes('oracle') && !q.includes('overtime') && !q.includes('sports'))) {
    matchedSeller = availableSellers.find(s => s.name.toLowerCase().includes('pyth'));
  } else if (q.includes('opensea') || q.includes('seaport') || q.includes('nft') || q.includes('punk') || q.includes('bayc')) {
    matchedSeller = availableSellers.find(s => s.name.toLowerCase().includes('opensea') || s.name.toLowerCase().includes('seaport'));
  } else if (q.includes('perpl') || q.includes('futures') || q.includes('perp')) {
    matchedSeller = availableSellers.find(s => s.name.toLowerCase().includes('perpl'));
  } else if (q.includes('overtime') || q.includes('sport') || q.includes('odds') || q.includes('nfl') || q.includes('spreads') || q.includes('epl')) {
    matchedSeller = availableSellers.find(s => s.name.toLowerCase().includes('overtime') || s.name.toLowerCase().includes('sport'));
  } else if (q.includes('monad') && (q.includes('telemetry') || q.includes('mempool') || q.includes('sequencer') || q.includes('queue') || q.includes('gas') || q.includes('validator'))) {
    matchedSeller = availableSellers.find(s => s.name.toLowerCase().includes('monad'));
  }

  // Fallback to token scoring if not directly matched by protocol keyword
  if (!matchedSeller) {
    const stopWords = new Set([
      'pool', 'pools', 'high', 'frequency', 'rates', 'data', 'feed', 'feeds',
      'live', 'protocol', 'token', 'tokens', 'state', 'trades', 'floor', 'debt'
    ]);
    let highestScore = 0;
    for (const s of availableSellers) {
      const sName = s.name.toLowerCase();
      let score = 0;
      for (const w of sName.split(/[\s/&-]+/)) {
        if (w.length > 3 && !stopWords.has(w) && q.includes(w)) {
          score += w.length;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        matchedSeller = s;
      }
    }
  }

  if (!matchedSeller) {
    return {
      error: "No matching seller found for your request. Please specify a supported seller or dataset (e.g. Kuru, Aave, Uniswap, Perpl, OpenSea, Overtime, Polymarket, Compound, Curve).",
    };
  }

  // 1. First extract freshness/age so time words like "under 10s" aren't confused with price
  let maxAgeSeconds: number | undefined;
  const ageMatch = q.match(/(?:freshness(?:\s*(?:floor|of|under|below|within|<=?))?|under|max|less than|within)\s*(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i) ||
    q.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\s*old/i) ||
    q.match(/(\d+(?:\.\d+)?)\s*s\b/i);
  if (ageMatch) {
    maxAgeSeconds = parseFloat(ageMatch[1]);
  }

  if (maxAgeSeconds === undefined || isNaN(maxAgeSeconds) || maxAgeSeconds <= 0) {
    return {
      error: `Missing or ambiguous freshness limit. Please specify a freshness window (e.g. "under 10 seconds old") instead of guessing.`,
    };
  }

  // 2. Extract price: MUST NOT match "V3 USDC" as 3 USDC
  let maxPrice: number | undefined;
  const centsMatch = q.match(/(\d+(?:\.\d+)?)\s*cents?/i);
  if (centsMatch) {
    maxPrice = parseFloat(centsMatch[1]) / 100;
  } else {
    // Look for explicit price indicators:
    // (a) "max 0.25 usdc", "budget: 0.30", "cap of $0.40"
    const priceWithWord = q.match(/(?:max(?:imum)?|budget|cap|at most|price of|limit of)\s*\$?(\d+(?:\.\d+)?)(?!\s*(?:seconds?|secs?|s)\b)/i);
    const dollarMatch = q.match(/\$(\d+(?:\.\d+)?)/);
    // (b) "0.25 usdc" (negative lookbehind ensures not preceded by "v" e.g. "v3 usdc")
    const usdcMatch = q.match(/(?<!v\s*|\bv)(\d+(?:\.\d+)?)\s*(?:usdc|usd|dollars?)\b/i);
    const underPrice = q.match(/under\s*\$?(\d+(?:\.\d+)?)\s*(?:usdc|usd|dollars?)/i);

    if (priceWithWord) {
      maxPrice = parseFloat(priceWithWord[1]);
    } else if (dollarMatch) {
      maxPrice = parseFloat(dollarMatch[1]);
    } else if (underPrice) {
      maxPrice = parseFloat(underPrice[1]);
    } else if (usdcMatch) {
      maxPrice = parseFloat(usdcMatch[1]);
    }
  }

  if (maxPrice === undefined || isNaN(maxPrice) || maxPrice <= 0) {
    return {
      error: `Missing or ambiguous price limit. Please specify a maximum budget (e.g. "max 0.25 USDC" or "max 5 cents") instead of guessing.`,
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

    const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
    const sellersPromptText = (availableSellers || [])
      .map((s: SellerOption) => `- "${s.name}" (sellerId: ${s.sellerId}, base price: ${s.priceUsdc ?? 0.25} USDC, promised SLA: ${s.freshnessSlaSeconds ?? 10}s)`)
      .join('\n');

    const systemPrompt = `You parse a user's natural-language data request into a structured purchase call. Available datasets and their sellerIds:
${sellersPromptText}

Return ONLY a JSON object matching this schema: { "sellerId": string, "matchedDatasetName": string, "maxPrice": number, "maxAgeSeconds": number }.
Set "sellerId" to "veris.eth" and "matchedDatasetName" to the exact matching dataset name.
If the request is ambiguous, missing a price or freshness limit, or doesn't match any known seller/dataset, return { "error": string } explaining what's missing instead of guessing.
Do NOT include markdown backticks or any explanatory text outside the JSON.`;

    if (apiKey && apiKey !== '') {
      try {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
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
