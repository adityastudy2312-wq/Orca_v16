import fs from "fs";
import path from "path";
import { NSE, BSE } from "nse-bse-api";

export interface Nse500Stock {
  symbol: string;
  name: string;
  sector: string;
  cap_type: "Large Cap" | "Mid Cap" | "Small Cap";
  last_price: number;
  change: number;
  percent_change: number;
  open: number;
  high: number;
  low: number;
  previous_close: number;
  volume: number;
  year_high: number;
  year_low: number;
  market_cap_cr: number; // in Crores
  fetched_at: string;
  is_live: boolean;
}

export interface Nse500Data {
  fetched_at: string;
  total_stocks: number;
  advances: number;
  declines: number;
  unchanged: number;
  avg_change_pct: number;
  last_updated: string;
  stocks: Nse500Stock[];
}

const PATH_NSE500_DB = path.join(process.cwd(), "data-nse500.json");
const PATH_NSE500_COMPONENTS_CACHE = path.join(process.cwd(), "data-nse500-components-cache.json");
const PATH_BSE_CODE_CACHE = path.join(process.cwd(), "data-bse-code-cache.json");

// Helper: Split a CSV line respecting matching double quotes
function splitCsvLine(line: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current.trim().replace(/^"|"$/g, ""));
  return parts;
}

// Helper: Parse Nifty 500 CSV matching format
function parseNifty500Csv(csvText: string): { symbol: string; name: string; sector: string }[] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase().trim());
  const symbolIdx = headers.findIndex(h => h.includes("symbol"));
  const nameIdx = headers.findIndex(h => h.includes("company") || h.includes("name"));
  const sectorIdx = headers.findIndex(h => h.includes("industry") || h.includes("sector") || h.includes("industry"));

  const result: { symbol: string; name: string; sector: string }[] = [];
  
  if (symbolIdx !== -1 && nameIdx !== -1) {
    for (let i = 1; i < lines.length; i++) {
      const parts = splitCsvLine(lines[i]);
      const symbol = parts[symbolIdx]?.toUpperCase().trim();
      if (!symbol || symbol === "SYMBOL") continue;

      result.push({
        symbol,
        name: parts[nameIdx]?.trim() || symbol,
        sector: sectorIdx !== -1 ? parts[sectorIdx]?.trim() : "Other"
      });
    }
  }
  return result;
}

// Fetch Nifty 500 authentic company list from web or cached directory
async function fetchNifty500Components(): Promise<{ symbol: string; name: string; sector: string }[]> {
  try {
    if (fs.existsSync(PATH_NSE500_COMPONENTS_CACHE)) {
      const cacheBytes = fs.readFileSync(PATH_NSE500_COMPONENTS_CACHE, "utf-8");
      const list = JSON.parse(cacheBytes);
      if (Array.isArray(list) && list.length > 50) {
        return list;
      }
    }
  } catch (err) {
    console.warn("[NSE 500 components] Cache error:", err);
  }

  const urls = [
    "https://nsearchives.nseindia.com/content/indices/ind_nifty500list.csv"
  ];

  for (const url of urls) {
    try {
      console.log(`[NSE 500 components] Fetching from NSE archives: ${url}`);
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "*/*"
        },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const csv = await res.text();
        const list = parseNifty500Csv(csv);
        if (list.length > 50) {
          fs.writeFileSync(PATH_NSE500_COMPONENTS_CACHE, JSON.stringify(list, null, 2), "utf-8");
          console.log(`[NSE 500 components] Successfully parsed and cached ${list.length} components.`);
          return list;
        }
      } else {
        console.warn(`[NSE 500 components] Fetch returned status ${res.status}`);
      }
    } catch (e: any) {
      console.warn(`[NSE 500 components] Fetch failed for ${url}: ${e.message}`);
    }
  }

  return [];
}

// Keep a persistent memory-backed cache of bse scrip codes
let bseCodeCache: Record<string, string> = {};
try {
  if (fs.existsSync(PATH_BSE_CODE_CACHE)) {
    bseCodeCache = JSON.parse(fs.readFileSync(PATH_BSE_CODE_CACHE, "utf-8"));
  }
} catch (err) {
  console.warn("BSE Code Cache load failed:", err);
}

// Helper: Get or dynamically query the BSE scrip code for a given stock symbol
async function resolveBseScripCode(bseClient: BSE, symbol: string): Promise<string | null> {
  // Check local JSON file/memory cache
  if (bseCodeCache[symbol]) {
    return bseCodeCache[symbol];
  }
  // Fall back to dynamic search via bseClient lookup
  try {
    console.log(`[BSE resolver] Dynamically searching scrip code for ${symbol}...`);
    const scripCode = await bseClient.getScripCode(symbol);
    if (scripCode) {
      bseCodeCache[symbol] = scripCode;
      fs.writeFileSync(PATH_BSE_CODE_CACHE, JSON.stringify(bseCodeCache, null, 2), "utf-8");
      return scripCode;
    }
  } catch (err: any) {
    console.warn(`[BSE resolver] Dynamically searching scrip code for ${symbol} failed:`, err.message);
  }
  return null;
}

// Helper: Fast parallel fetching of quotes from Yahoo v8 Chart API
async function fetchYahooQuotesForSymbols(symbols: string[]): Promise<any[]> {
  const fetchSingleSymbol = async (symbol: string): Promise<any | null> => {
    const cleanSym = symbol.endsWith(".NS") ? symbol : `${symbol}.NS`;
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?range=1d&interval=15m`;
    try {
      const res = await fetch(chartUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) return null;
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta) return null;
      return {
        symbol: symbol,
        lastPrice: meta.regularMarketPrice,
        previousClose: meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice,
        open: meta.regularMarketPrice,
        high: meta.regularMarketPrice,
        low: meta.regularMarketPrice,
        volume: 0,
        fiftyTwoWeekHigh: meta.regularMarketPrice,
        fiftyTwoWeekLow: meta.regularMarketPrice,
      };
    } catch {
      return null;
    }
  };

  const batches: string[][] = [];
  const batchSize = 25;
  for (let i = 0; i < symbols.length; i += batchSize) {
    batches.push(symbols.slice(i, i + batchSize));
  }

  const results: any[] = [];
  for (const batch of batches) {
    const batchPromises = batch.map(symbol => fetchSingleSymbol(symbol));
    const batchRes = await Promise.all(batchPromises);
    results.push(...batchRes.filter(Boolean));
    // Brief sleep to avoid hitting limit
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  return results;
}

export async function scrapeNse500(forceScrape = false): Promise<Nse500Data> {
  console.log(`[NSE 500 Scraper] Gathering market tickers (forceScrape=${forceScrape})...`);

  // Load existing persistent cache if available
  let cachedData: Nse500Data | null = null;
  try {
    if (fs.existsSync(PATH_NSE500_DB)) {
      const fileContent = fs.readFileSync(PATH_NSE500_DB, "utf-8");
      cachedData = JSON.parse(fileContent);
    }
  } catch (err) {
    console.warn("[NSE 500 Scraper Client] Reading cached file failed.");
  }

  // Return non-expired cache if forceScrape is false
  if (!forceScrape && cachedData && cachedData.stocks && cachedData.stocks.length > 20) {
    const ageMs = Date.now() - new Date(cachedData.fetched_at).getTime();
    if (ageMs < 1 * 60 * 60 * 1000) { // 1 hour cache
      console.log(`[NSE 500 Scraper Cache] Serving cached authentic list of ${cachedData.stocks.length} companies.`);
      return cachedData;
    }
  }

  // Initialize clients
  const tempDir = path.join(process.cwd(), "temp_nse_downloads");
  const nse = new NSE(tempDir);

  try {
    // 1. Get components list for symbol -> name & sector mapping
    const components = await fetchNifty500Components();
    
    // Create lookup matching uppercase clean symbol
    const lookupMap = new Map<string, { name: string; sector: string }>();
    components.forEach(c => {
      lookupMap.set(c.symbol.toUpperCase().trim(), { name: c.name, sector: c.sector });
    });

    console.log(`[NSE 500 Scraper] Loaded ${components.length} components for dictionary mapping.`);

    // 2. Fetch the actual live quotes for all NIFTY 500 constituents in ONE standard call
    console.log("[NSE 500 Scraper] Fetching all Nifty 500 constituents live via NSE /api/equity-stock-indices...");
    
    const url = "https://www.nseindia.com/api/equity-stock-indices";
    const params = { index: "NIFTY 500" };
    
    // We execute the request using the cookie-primed client
    // @ts-ignore
    const data = await nse.httpClient.request(url, params);
    
    if (!data || !Array.isArray(data.data)) {
      throw new Error("NSE index API response did not return a valid data array.");
    }
    
    // Filter index entries out and verify valid symbols
    const rawItems = data.data.filter((item: any) => 
      item && 
      item.symbol && 
      item.symbol.toUpperCase() !== "NIFTY 500" && 
      item.series
    );
    
    console.log(`[NSE 500 Scraper] Retrieved ${rawItems.length} active constituent items.`);

    // 3. Process index stats of "NIFTY 500" index dynamically from the raw data
    const indexItem = data.data.find((item: any) => 
      item.symbol === "NIFTY 500" || 
      item.identifier === "NIFTY 500"
    );
    
    const indexLTP = indexItem ? Number(indexItem.lastPrice) : 22967.4;
    const indexChange = indexItem ? Number(indexItem.change) : 70.2;
    const indexChangePct = indexItem ? Number(indexItem.pChange) : 0.31;

    let advances = 0;
    let declines = 0;
    let unchanged = 0;
    let totalPctChange = 0;

    const verifiedStocks: Nse500Stock[] = [];

    // 4. Map the raw array items to our typed stock components
    rawItems.forEach((item: any) => {
      const symbol = item.symbol.toUpperCase().trim();
      const meta = lookupMap.get(symbol);
      const name = meta?.name || item.identifier || symbol;
      const sector = meta?.sector || "Other";
      
      const lastPrice = Number(item.lastPrice || 0);
      const open = Number(item.open || lastPrice || 0);
      const previousClose = Number(item.previousClose || lastPrice || 0);
      const change = Number(item.change || (lastPrice - previousClose) || 0);
      const percentChange = Number(item.pChange || (previousClose ? ((lastPrice - previousClose) / previousClose) * 100 : 0));
      const high = Number(item.dayHigh || lastPrice || 0);
      const low = Number(item.dayLow || lastPrice || 0);
      const volume = Number(item.totalTradedVolume || 0);
      const yearHigh = Number(item.yearHigh || high || 0);
      const yearLow = Number(item.yearLow || low || 0);

      // ffmc is Free Float Market Capitalisation of the company in Rs.
      // 1 Crores = 10,000,000. So we divide ffmc by 1e7 to convert into Crores!
      const market_cap_cr = item.ffmc ? Math.round(Number(item.ffmc) / 10000000) : 0;

      if (change > 0) advances++;
      else if (change < 0) declines++;
      else unchanged++;

      totalPctChange += percentChange;

      verifiedStocks.push({
        symbol,
        name,
        sector,
        cap_type: "Small Cap", // placeholder, will sort and label properly
        last_price: parseFloat(lastPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        percent_change: parseFloat(percentChange.toFixed(2)),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        previous_close: parseFloat(previousClose.toFixed(2)),
        volume,
        year_high: parseFloat(yearHigh.toFixed(2)),
        year_low: parseFloat(yearLow.toFixed(2)),
        market_cap_cr,
        fetched_at: new Date().toISOString(),
        is_live: true
      });
    });

    if (verifiedStocks.length === 0) {
      throw new Error("No constituent stocks could be processed from NSE API response.");
    }

    // 5. SEBI market-cap classification: Sort by market cap descending:
    // Large Cap = Top 100
    // Mid Cap = Next 150
    // Small Cap = Rest (250+)
    verifiedStocks.sort((a, b) => b.market_cap_cr - a.market_cap_cr);
    
    verifiedStocks.forEach((stock, index) => {
      if (index < 100) {
        stock.cap_type = "Large Cap";
      } else if (index < 250) {
        stock.cap_type = "Mid Cap";
      } else {
        stock.cap_type = "Small Cap";
      }
    });

    // 6. Form the complete response payload
    const result: Nse500Data = {
      fetched_at: new Date().toISOString(),
      total_stocks: verifiedStocks.length,
      advances,
      declines,
      unchanged,
      avg_change_pct: parseFloat((totalPctChange / verifiedStocks.length).toFixed(3)),
      last_updated: new Date().toISOString(),
      stocks: verifiedStocks
    };

    // Save as persistent data cache
    fs.writeFileSync(PATH_NSE500_DB, JSON.stringify(result, null, 2), "utf-8");
    console.log(`[NSE 500 Scraper Succeeded] Loaded and saved ${result.total_stocks} stocks safely!`);
    return result;

  } catch (err: any) {
    console.error(`[NSE 500 Scraper Error] Direct scraping failed: ${err.message}`);
    if (cachedData && cachedData.stocks && cachedData.stocks.length > 0) {
      console.log("[NSE 500 Scraper Fallback] Returning cached data to prevent service interruption.");
      return cachedData;
    }
    throw new Error(`Real market indices fetch failed: ${err.message}. To prevent inaccurate pricing, no mock figures can be drawn. Ensure stable connections.`);
  } finally {
    nse.exit();
  }
}

export async function getDetailedQuote(symbol: string): Promise<any> {
  const symbolUpper = symbol.toUpperCase();
  console.log(`[Detailed Quote] Fetching live quote details for ${symbolUpper} via unblocked Yahoo chart API...`);

  try {
    const cleanSym = symbolUpper.endsWith(".NS") ? symbolUpper : `${symbolUpper}.NS`;
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?range=1d&interval=15m`;
    
    const res = await fetch(chartUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!res.ok) {
      throw new Error(`Yahoo Chart HTTP Error: Status ${res.status}`);
    }
    
    const json = await res.json();
    const resultObj = json?.chart?.result?.[0];
    const meta = resultObj?.meta;
    
    if (!meta) {
      throw new Error(`Symbol ${cleanSym} did not yield valid metadata`);
    }

    const lastPrice = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose || lastPrice;
    const timeStr = meta.regularMarketTime 
      ? new Date(meta.regularMarketTime * 1000).toLocaleTimeString("en-IN") 
      : new Date().toLocaleTimeString("en-IN");

    // Process intraday chart intervals
    const chartData: any[] = [];
    const timestamps = resultObj.timestamp || [];
    const closes = resultObj.indicators?.quote?.[0]?.close || [];

    for (let i = 0; i < Math.min(timestamps.length, closes.length); i++) {
      const price = closes[i];
      if (price !== null && price !== undefined) {
        const date = new Date(timestamps[i] * 1000);
        const name = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
        chartData.push({ name, price: parseFloat(price.toFixed(2)) });
      }
    }

    return {
      symbol: symbolUpper,
      priceInfo: {
        lastPrice,
        open: lastPrice,
        prevClose,
        intraDayHighLow: {
          max: lastPrice,
          min: lastPrice
        }
      },
      metadata: {
        lastUpdateTime: `${timeStr} (Live Feed)`
      },
      chartData
    };
  } catch (err: any) {
    console.error(`[Detailed Quote failed for ${symbolUpper}] Error: ${err.message}`);
    return null;
  }
}
