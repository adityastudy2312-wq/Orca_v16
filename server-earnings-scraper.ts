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

  // Source 1: Finology Ticker - has live earnings announcements
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

          // Avoid duplicates
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

      console.log(`[Earnings Scraper] Finology: Found ${data.result_calendar.length} earnings entries`);
    }
  } catch (err: any) {
    console.warn(`[Earnings Scraper] Finology fetch failed: ${err.message}`);
  }

  // Source 2: Try Screener.in latest results screen
  if (data.result_calendar.length < 5) {
    try {
      console.log("[Earnings Scraper] Trying Screener.in...");
      const res = await fetch("https://www.screener.in/screens/185521/latest-results/", {
        headers: {
          ...headers,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(20000)
      });

      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);

        $("table.data-table tr").each((rowIdx, row) => {
          if (rowIdx === 0) return; // Skip header
          const cells = $(row).find("td");
          if (cells.length >= 2) {
            const name = normalize($(cells[0]).text());
            const resultDate = cells.length >= 3 ? normalize($(cells[2]).text()) : "";
            const symbol = name.toUpperCase().replace(/\s+/g, "").substring(0, 10);

            if (name && name.length > 2 && !data.result_calendar.find(c => c.name === name)) {
              data.result_calendar.push({
                name,
                symbol,
                result_date: resultDate || new Date().toLocaleDateString(),
                sector: ""
              });
            }
          }
        });
      }
    } catch (err: any) {
      console.warn(`[Earnings Scraper] Screener fetch failed: ${err.message}`);
    }
  }

  // Source 3: Try Moneycontrol earnings calendar page directly
  if (data.result_calendar.length < 5) {
    try {
      console.log("[Earnings Scraper] Trying Moneycontrol earnings calendar...");
      const res = await fetch("https://www.moneycontrol.com/earnings-calendar/", {
        headers,
        signal: AbortSignal.timeout(20000)
      });

      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);

        // Parse any calendar tables
        $("table tr").each((rowIdx, row) => {
          if (rowIdx === 0) return;
          const cells = $(row).find("td");
          if (cells.length >= 2) {
            const name = normalize($(cells[0]).text());
            const resultDate = normalize($(cells[1]).text());

            if (name && name.length > 2 && !name.toLowerCase().includes("login") && !data.result_calendar.find(c => c.name === name)) {
              data.result_calendar.push({
                name,
                symbol: name.toUpperCase().replace(/\s+/g, "").substring(0, 10),
                result_date: resultDate,
                sector: cells.length >= 3 ? normalize($(cells[2]).text()) : ""
              });
            }
          }
        });
      }
    } catch (err: any) {
      console.warn(`[Earnings Scraper] Moneycontrol calendar fetch failed: ${err.message}`);
    }
  }

  // Source 4: Try Marketsmojo or other sources for earnings updates
  try {
    console.log("[Earnings Scraper] Fetching earnings news updates...");
    const res = await fetch("https://www.marketsmojo.com/news/earnings", {
      headers,
      signal: AbortSignal.timeout(15000)
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);

      $("a, div.news-item, div.earning-item").each((_, el) => {
        const text = normalize($(el).text());

        // Match patterns like "Company revenue up XX% YoY" or similar earnings news
        if (text.includes("revenue") || text.includes("profit") || text.includes("sales")) {
          const companyMatch = text.match(/^([A-Z][A-Za-z0-9\s]+?)(?:\s+revenue|\s+profit|\s+net|\s+quarterly)/i);
          const growthMatch = text.match(/(?:up|down)\s+([\d\.]+)%/i);

          if (companyMatch && growthMatch) {
            const company = companyMatch[1].trim();
            if (company.length >= 3 && !data.earnings_updates.find(e => e.company === company)) {
              data.earnings_updates.push({
                company,
                period: "Q4 FY25",
                net_sales: "N/A",
                yoy_growth: (text.toLowerCase().includes("down") ? "-" : "") + growthMatch[1] + "%"
              });
            }
          }
        }
      });
    }
  } catch (err: any) {
    console.warn(`[Earnings Scraper] Marketsmojo fetch failed: ${err.message}`);
  }

  console.log(`[Earnings Scraper] Total: ${data.result_calendar.length} calendar entries, ${data.earnings_updates.length} updates`);

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
