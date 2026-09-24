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

                  const anthropicData = await anthropicRes.json();
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
