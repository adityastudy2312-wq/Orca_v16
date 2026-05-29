import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface EarningsCompany {
  name: string;
  symbol?: string;
  result_date: string;
  sector?: string;
  ltp?: number;
  change_pct?: number;
  gain_loss_since_result?: number;
}

export interface EarningsUpdate {
  company: string;
  period: string;
  net_sales: string;
  yoy_growth: string;
  timestamp?: string;
}

export interface SectorPerformance {
  sector: string;
  market_cap_cr: number;
  revenue_qoq: number;
  revenue_yoy: number;
  gross_profit_qoq: number;
  gross_profit_yoy: number;
  net_profit_qoq: number;
  net_profit_yoy: number;
  type: "top_performer" | "under_performer";
}

export interface MarketSnapshot {
  category: string;
  count?: string;
  revenue?: number;
  revenue_yoy?: number;
  gross_profit?: number;
  gross_profit_yoy?: number;
  net_profit?: number;
  net_profit_yoy?: number;
}

export interface EarningsData {
  fetched_at: string;
  result_calendar: EarningsCompany[];
  rapid_results: EarningsCompany[];
  earnings_updates: EarningsUpdate[];
  sector_performers: SectorPerformance[];
  market_snapshots: MarketSnapshot[];
  price_shocker: EarningsCompany[];
}

const PATH_EARNINGS_DB = path.join(DATA_DIR, "data-earnings.json");

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function parseAmount(value: string): number | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/,/g, "").replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

export async function scrapeMoneycontrolEarnings(): Promise<EarningsData> {
  console.log(`[Earnings Scraper] Starting earnings data fetch...`);

  const data: EarningsData = {
    fetched_at: new Date().toISOString(),
    result_calendar: [],
    rapid_results: [],
    earnings_updates: [],
    sector_performers: [],
    market_snapshots: [],
    price_shocker: []
  };

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9"
  };

  // Source 1: Finology Ticker - Primary source with live earnings announcements
  try {
    console.log("[Earnings Scraper] Fetching from Finology Ticker...");
    const res = await fetch("https://ticker.finology.in/", {
      headers,
      signal: AbortSignal.timeout(20000)
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);

      // Parse earnings announcements from the homepage
      $("a.newslink[data-subsecname='EARNINGS']").each((_, el) => {
        const title = normalize($(el).find("span.h6").text());
        const timestamp = normalize($(el).find("small").first().text());
        const badge = $(el).find(".badge").text().trim();

        // Extract company name - pattern "Company Name - Quaterly Results"
        const match = title.match(/^(.+?)\s*-\s*Quaterly Results$/i);
        if (match) {
          const companyName = match[1].trim();
          const symbol = badge || companyName.toUpperCase().replace(/\s+/g, "");

          if (!data.result_calendar.find(c => c.name === companyName)) {
            data.result_calendar.push({
              name: companyName,
              symbol: symbol,
              result_date: timestamp.split(",")[0] || timestamp,
              sector: ""
            });
          }
        }
      });

      // Also parse company news items which may contain earnings info
      $("a.newslink[data-secname='COMPANY']").each((_, el) => {
        const title = normalize($(el).find("span.h6").text());
        const timestamp = normalize($(el).find("small").first().text());
        const badge = $(el).find(".badge").text().trim();

        // Check if it's results-related
        if (title.toLowerCase().includes("result") || title.toLowerCase().includes("quarter") || title.toLowerCase().includes("earning")) {
          const companyMatch = title.match(/^(.+?)\s*[-–]/);
          if (companyMatch) {
            const companyName = companyMatch[1].trim();
            if (!data.result_calendar.find(c => c.name === companyName)) {
              data.result_calendar.push({
                name: companyName,
                symbol: badge || companyName.toUpperCase().replace(/\s+/g, ""),
                result_date: timestamp.split(",")[0] || timestamp,
                sector: ""
              });
            }
          }
        }
      });

      console.log(`[Earnings Scraper] Finology: Found ${data.result_calendar.length} earnings entries`);
    }
  } catch (err: any) {
    console.warn(`[Earnings Scraper] Finology fetch failed: ${err.message}`);
  }

  // Source 2: Economic Times earnings section
  if (data.result_calendar.length < 10) {
    try {
      console.log("[Earnings Scraper] Fetching from Economic Times...");
      const res = await fetch("https://economictimes.indiatimes.com/markets/stocks/earnings", {
        headers,
        signal: AbortSignal.timeout(20000)
      });

      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);

        // Parse ET earnings news/announcements
        $("a, h3, h4").each((_, el) => {
          const text = normalize($(el).text());
          const href = $(el).attr("href") || "";

          // Look for earnings/result news
          if (text.toLowerCase().includes("result") || text.toLowerCase().includes("q1") || text.toLowerCase().includes("q2") || text.toLowerCase().includes("q3") || text.toLowerCase().includes("q4")) {
            // Extract company name
            const companyMatch = text.match(/^([A-Z][A-Za-z0-9\s]+?)(?:\s+(?:Q[1-4]|result|net|profit|revenue|sales))-|:\s/);
            if (companyMatch) {
              const companyName = companyMatch[1].trim();
              if (companyName.length >= 3 && companyName.length <= 50 && !data.result_calendar.find(c => c.name === companyName)) {
                data.result_calendar.push({
                  name: companyName,
                  symbol: companyName.toUpperCase().replace(/\s+/g, "").substring(0, 10),
                  result_date: new Date().toLocaleDateString(),
                  sector: ""
                });
              }
            }
          }
        });
        console.log(`[Earnings Scraper] ET: Total ${data.result_calendar.length} entries`);
      }
    } catch (err: any) {
      console.warn(`[Earnings Scraper] Economic Times fetch failed: ${err.message}`);
    }
  }

  // Source 3: Business Standard results
  if (data.result_calendar.length < 10) {
    try {
      console.log("[Earnings Scraper] Fetching from Business Standard...");
      const res = await fetch("https://www.business-standard.com/markets/news-results", {
        headers,
        signal: AbortSignal.timeout(20000)
      });

      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);

        // Parse BS result news
        $("a[href*='result'], a[href*='earning']").each((_, el) => {
          const text = normalize($(el).text());
          if (text.length > 10) {
            // Extract company name from title
            const words = text.split(/\s+/).slice(0, 3).join(" ");
            if (words.length >= 3 && words.length <= 50) {
              const existing = data.result_calendar.find(c => c.name.toLowerCase().includes(words.toLowerCase()) || words.toLowerCase().includes(c.name.toLowerCase()));
              if (!existing) {
                data.result_calendar.push({
                  name: text.substring(0, 50),
                  symbol: words.toUpperCase().replace(/\s+/g, "").substring(0, 10),
                  result_date: new Date().toLocaleDateString(),
                  sector: ""
                });
              }
            }
          }
        });
      }
    } catch (err: any) {
      console.warn(`[Earnings Scraper] Business Standard fetch failed: ${err.message}`);
    }
  }

  // Source 4: Livemint earnings
  if (data.result_calendar.length < 5) {
    try {
      console.log("[Earnings Scraper] Fetching from Livemint...");
      const res = await fetch("https://www.livemint.com/market/stock-market-news", {
        headers,
        signal: AbortSignal.timeout(15000)
      });

      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);

        $("a[href*='earning'], a[href*='result']").each((_, el) => {
          const text = normalize($(el).text());
          if (text.toLowerCase().includes("result") || text.toLowerCase().includes("quarter")) {
            const words = text.split(/\s+/).slice(0, 4).join(" ");
            if (words.length >= 5 && words.length <= 60 && !data.result_calendar.find(c => c.name === text.substring(0, 50))) {
              data.result_calendar.push({
                name: text.substring(0, 50),
                symbol: words.toUpperCase().replace(/\s+/g, "").substring(0, 10),
                result_date: new Date().toLocaleDateString(),
                sector: ""
              });
            }
          }
        });
      }
    } catch (err: any) {
      console.warn(`[Earnings Scraper] Livemint fetch failed: ${err.message}`);
    }
  }

  console.log(`[Earnings Scraper] Total: ${data.result_calendar.length} calendar entries`);

  // Save to cache
  try {
    fs.writeFileSync(PATH_EARNINGS_DB, JSON.stringify(data, null, 2), "utf-8");
  } catch (saveErr) {
    console.warn("[Earnings Scraper] Failed to save cache:", saveErr);
  }

  return data;
}

export function loadCachedEarnings(): EarningsData | null {
  try {
    if (fs.existsSync(PATH_EARNINGS_DB)) {
      return JSON.parse(fs.readFileSync(PATH_EARNINGS_DB, "utf-8"));
    }
  } catch (err) {
    console.warn("[Earnings Loader] Cache load failed:", err);
  }
  return null;
}
