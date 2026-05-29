import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface LiveEarningsCall {
  title: string;
  timestamp: string;
  link?: string;
  company?: string;
  time?: string;
}

export interface LiveEarningsData {
  fetched_at: string;
  live_calls: LiveEarningsCall[];
}

const PATH_LIVE_EARNINGS_DB = path.join(DATA_DIR, "data-live-earnings.json");

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export async function scrapeLiveEarningsCalls(): Promise<LiveEarningsData> {
  console.log(`[Live Earnings Scraper] ========== STARTING LIVE EARNINGS SCRAPE ==========`);

  const data: LiveEarningsData = {
    fetched_at: new Date().toISOString(),
    live_calls: []
  };

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9"
  };

  // IndStocks is behind Cloudflare, try alternative sources
  console.log(`[Live Earnings Scraper] Attempting to fetch from alternative sources...`);

  // Try BSE Results page
  try {
    console.log(`[Live Earnings Scraper] Fetching from BSE...`);
    const res = await fetch("https://www.bseindia.com/corporates/Result.html", {
      headers,
      signal: AbortSignal.timeout(15000)
    });

    console.log(`[Live Earnings Scraper] BSE - Status: ${res.status}`);

    if (res.ok) {
      const html = await res.text();
      console.log(`[Live Earnings Scraper] BSE - Received ${html.length} bytes`);

      const $ = cheerio.load(html);
      const seen = new Set<string>();

      // Parse earnings/results from BSE page
      $("a, tr, td, div").each((_, el) => {
        const text = normalize($(el).text());

        if (
          text.length >= 15 &&
          text.length <= 150 &&
          (text.toLowerCase().includes("result") ||
            text.toLowerCase().includes("earnings") ||
            text.toLowerCase().includes("conference") ||
            text.toLowerCase().includes("call")) &&
          !seen.has(text)
        ) {
          seen.add(text);

          console.log(`[Live Earnings Scraper] BSE found: ${text.substring(0, 60)}...`);

          data.live_calls.push({
            title: text,
            timestamp: new Date().toLocaleTimeString(),
            link: "https://www.bseindia.com/corporates/Result.html",
            company: extractCompanyName(text)
          });
        }
      });

      if (data.live_calls.length > 0) {
        console.log(`[Live Earnings Scraper] BSE: Found ${data.live_calls.length} live earnings calls`);
      }
    }
  } catch (err: any) {
    console.warn(`[Live Earnings Scraper] BSE fetch failed: ${err.message}`);
  }

  // Try NSE results page if BSE didn't return much
  if (data.live_calls.length < 3) {
    try {
      console.log(`[Live Earnings Scraper] Fetching from NSE...`);
      const res = await fetch("https://www.nseindia.com/news/newscommodity.jsp", {
        headers,
        signal: AbortSignal.timeout(15000)
      });

      console.log(`[Live Earnings Scraper] NSE - Status: ${res.status}`);

      if (res.ok) {
        const html = await res.text();
        console.log(`[Live Earnings Scraper] NSE - Received ${html.length} bytes`);

        const $ = cheerio.load(html);
        const seen = new Set<string>();

        $("a, span, div").each((_, el) => {
          const text = normalize($(el).text());

          if (
            text.length >= 15 &&
            text.length <= 150 &&
            (text.toLowerCase().includes("result") ||
              text.toLowerCase().includes("earnings") ||
              text.toLowerCase().includes("conference")) &&
            !seen.has(text)
          ) {
            seen.add(text);
            const addedCount = data.live_calls.length;

            data.live_calls.push({
              title: text,
              timestamp: new Date().toLocaleTimeString(),
              link: "https://www.nseindia.com/news/",
              company: extractCompanyName(text)
            });

            if (data.live_calls.length > addedCount) {
              console.log(`[Live Earnings Scraper] NSE found: ${text.substring(0, 60)}...`);
            }
          }
        });

        if (data.live_calls.length > 0) {
          console.log(`[Live Earnings Scraper] NSE: Total ${data.live_calls.length} live earnings calls`);
        }
      }
    } catch (err: any) {
      console.warn(`[Live Earnings Scraper] NSE fetch failed: ${err.message}`);
    }
  }

  // Try Finology as fallback (we know this works)
  if (data.live_calls.length < 3) {
    try {
      console.log(`[Live Earnings Scraper] Fetching from Finology as fallback...`);
      const res = await fetch("https://ticker.finology.in/", {
        headers,
        signal: AbortSignal.timeout(15000)
      });

      console.log(`[Live Earnings Scraper] Finology - Status: ${res.status}`);

      if (res.ok) {
        const html = await res.text();
        console.log(`[Live Earnings Scraper] Finology - Received ${html.length} bytes`);

        const $ = cheerio.load(html);

        // Parse earnings calls from Finology
        $("a.newslink[data-subsecname='EARNINGS']").each((_, el) => {
          const title = normalize($(el).find("span.h6").text());
          const timestamp = normalize($(el).find("small").first().text());

          if (title.toLowerCase().includes("call") || title.toLowerCase().includes("earnings")) {
            console.log(`[Live Earnings Scraper] Finology earnings: ${title.substring(0, 60)}...`);

            data.live_calls.push({
              title,
              timestamp: timestamp || new Date().toLocaleTimeString(),
              link: "",
              company: extractCompanyName(title)
            });
          }
        });
      }
    } catch (err: any) {
      console.warn(`[Live Earnings Scraper] Finology fallback failed: ${err.message}`);
    }
  }

  console.log(`[Live Earnings Scraper] ========== SCRAPE COMPLETE ==========`);
  console.log(`[Live Earnings Scraper] Total: ${data.live_calls.length} live earnings calls`);

  // Save to cache
  try {
    fs.writeFileSync(PATH_LIVE_EARNINGS_DB, JSON.stringify(data, null, 2), "utf-8");
    console.log(`[Live Earnings Scraper] Saved to cache: ${PATH_LIVE_EARNINGS_DB}`);
  } catch (saveErr) {
    console.error(`[Live Earnings Scraper] Failed to save cache: ${saveErr}`);
  }

  return data;
}

export function loadCachedLiveEarnings(): LiveEarningsData | null {
  try {
    if (fs.existsSync(PATH_LIVE_EARNINGS_DB)) {
      const cached = JSON.parse(fs.readFileSync(PATH_LIVE_EARNINGS_DB, "utf-8"));
      console.log(`[Live Earnings Loader] Loaded cached live earnings: ${cached.live_calls?.length || 0} calls`);
      return cached;
    }
  } catch (err) {
    console.warn("[Live Earnings Loader] Cache load failed:", err);
  }
  return null;
}

function extractCompanyName(text: string): string | undefined {
  // Extract company name from text
  // Patterns like "Company Name - Q4 Results", "Earnings call for XYZ Ltd", etc.
  const patterns = [
    /^(.+?)\s*(?:-|:)\s*(?:Q[1-4]|Earnings|Results|Conference\s+Call)/i,
    /^([A-Z][A-Za-z0-9\s]+?)\s+(?:declares|announces|reports|hosts)/i,
    /(?:for|of)\s+([A-Z][A-Za-z0-9\s]+?)\s+(?:Q[1-4]|earnings|results)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 50);
    }
  }

  // Extract first 2-3 capitalized words
  const words = text.split(/\s+/).filter(w => /^[A-Z]/.test(w));
  if (words.length >= 2) {
    return words.slice(0, 3).join(" ");
  }

  return undefined;
}
