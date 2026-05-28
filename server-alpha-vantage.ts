import fs from "fs";
import path from "path";

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Main catalog for global indices requested by the user
export const GLOBAL_INDICES_CATALOG: { [key: string]: string } = {
  "DJI": "Dow Jones Industrials ETF (DIA)",
  "SPX": "S&P 500 Index ETF (SPY)",
  "COMP": "NASDAQ Composite (QQQ Asset)",
  "NDX": "NASDAQ-100 ETF (QQQ)",
  "VIX": "Cboe Volatility ETF (VIXY)",
  "RUT": "Russell 2000 ETF (IWM)"
};

// Maps index symbols to compliant, free-tier accessible ETF tickers
const INDEX_TO_ETF_MAP: { [key: string]: string } = {
  "DJI": "DIA",
  "SPX": "SPY",
  "COMP": "QQQ",
  "NDX": "QQQ",
  "VIX": "VIXY",
  "RUT": "IWM"
};

export interface GlobalIndexValue {
  symbol: string;
  name: string;
  last_price: number;
  change: number;
  percent_change: number;
  fetched_at: string;
  is_cached?: boolean;
}

const CACHE_PATH = path.join(DATA_DIR, "data-alpha-vantage-cache.json");
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 Hour cache limit for free tier standard indexes

interface CacheStructure {
  fetched_at: string;
  etfs: {
    [symbol: string]: {
      last_price: number;
      change: number;
      percent_change: number;
      fetched_at: string;
    };
  };
}

// Loads cache safely
function loadCache(): CacheStructure {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const data = fs.readFileSync(CACHE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed.etfs) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to read Alpha Vantage cache file:", err);
  }
  return { fetched_at: "", etfs: {} };
}

// Saves cache safely
function saveCache(cache: CacheStructure) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write Alpha Vantage cache file:", err);
  }
}

/**
 * Fetches real market index values using Alpha Vantage free-tier compatible GLOBAL_QUOTE proxy.
 * If cached data exists and is fresh (within 1 hour), returns the cache.
 * Implements an intelligent serial delay rate limiter and merges COMP/NDX under QQQ to minimize calls.
 */
export async function fetchAlphaVantageIndices(apiKey: string): Promise<{ indices: GlobalIndexValue[]; message?: string }> {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("Alpha Vantage API Key is missing. Enter your key in the Settings panel.");
  }

  const cache = loadCache();
  const now = Date.now();
  const results: GlobalIndexValue[] = [];
  
  // Collect unique ETF symbols to fetch
  const indexSymbols = Object.keys(GLOBAL_INDICES_CATALOG);
  const uniqueEtfsNeeded = Array.from(new Set(indexSymbols.map(sym => INDEX_TO_ETF_MAP[sym])));
  
  let fetchedAny = false;
  let rateLimited = false;
  let rateLimitMessage = "";
  
  console.log(`[Alpha Vantage] Starting fetch for ${indexSymbols.length} indices using ETF proxies to bypass free-tier index restrictions...`);
  
  // Track how many active outgoing queries we run during this execution
  let outgoingCalls = 0;

  for (const etf of uniqueEtfsNeeded) {
    const cachedItem = cache.etfs[etf];
    const isCacheFresh = cachedItem && cache.fetched_at && (now - new Date(cachedItem.fetched_at).getTime() < CACHE_DURATION_MS);

    if (isCacheFresh) {
      console.log(`[Alpha Vantage] Cache hit for ${etf}`);
      continue;
    }

    // Otherwise, we perform a live fetch from the free-tier GLOBAL_QUOTE endpoint
    try {
      console.log(`[Alpha Vantage] Live fetch for ETF proxy: ${etf}`);
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${etf}&apikey=${apiKey}`;
      
      // Strict serial rate-limiting to fit well within Alpha Vantage's 5 calls per minute limit
      if (outgoingCalls > 0) {
        // 13 second sleep to prevent concurrent request rejection or rate limit exhaustion on free endpoints
        console.log(`[Alpha Vantage] Applying rate limiter delay (13 seconds) before requesting ${etf}...`);
        await new Promise(resolve => setTimeout(resolve, 13000));
      }

      outgoingCalls++;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      fetchedAny = true;

      // Check for Alpha Vantage standard rate-limit warnings or note structures
      if (data["Note"] || data["Information"]) {
        const msg = data["Note"] || data["Information"];
        console.warn(`[Alpha Vantage] Warn / Rate limiting response for ${etf}: ${msg}`);
        rateLimited = true;
        rateLimitMessage = msg;
        // Skip updating cache since we were rate limited
        continue;
      }

      const quote = data["Global Quote"];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error(`Invalid response structure for ${etf}. 'Global Quote' wrapper absent.`);
      }

      // Safe parse of various prefixed keys in Global Quote response
      const priceVal = parseFloat(quote["05. price"] || quote["price"] || "0");
      const changeVal = parseFloat(quote["09. change"] || quote["change"] || "0");
      const pctStr = quote["10. change percent"] || quote["change percent"] || "0%";
      const percentVal = parseFloat(pctStr.replace("%", "")) || 0;

      if (isNaN(priceVal)) {
        throw new Error(`Unable to parse close premium for ${etf}`);
      }

      // Record standard float data in local cache structures
      cache.etfs[etf] = {
        last_price: priceVal,
        change: changeVal,
        percent_change: percentVal,
        fetched_at: new Date().toISOString()
      };
      
    } catch (err: any) {
      console.error(`[Alpha Vantage] Error during live ETF crawl for ${etf}:`, err.message);
      
      // If no valid cache and we get an error on are first fetch, propagate it.
      if (!cachedItem) {
        throw new Error(`Failed to load ETF ${etf} and no older cache exists: ${err.message}`);
      }
    }
  }

  // Persist the updated cache safely
  if (fetchedAny && !rateLimited) {
    cache.fetched_at = new Date().toISOString();
    saveCache(cache);
  }

  // Re-map actual index records from the cached unique ETF proxy variables
  for (const indexSym of indexSymbols) {
    const etfTicker = INDEX_TO_ETF_MAP[indexSym];
    const item = cache.etfs[etfTicker];
    
    if (item) {
      results.push({
        symbol: indexSym,
        name: GLOBAL_INDICES_CATALOG[indexSym],
        last_price: item.last_price,
        change: item.change,
        percent_change: item.percent_change,
        fetched_at: item.fetched_at,
        is_cached: !fetchedAny
      });
    } else {
      console.warn(`[Alpha Vantage] Missing data value for ${indexSym} mapped from fallback ETF ${etfTicker}`);
    }
  }

  // Return full index model matching requirements
  return {
    indices: results,
    message: rateLimited 
      ? `Partially rate-limited: ${rateLimitMessage}. Loaded last synced positions.` 
      : undefined
  };
}
