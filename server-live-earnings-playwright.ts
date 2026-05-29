import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface LiveEarningsCall {
  id: string;
  title: string;
  timestamp: string;
  link?: string;
  company?: string;
  source: string;
  type: 'earnings_call' | 'result_announcement' | 'conference' | 'investor_meeting';
  priority: 'high' | 'medium' | 'low';
  fetched_at: string;
}

export interface LiveEarningsData {
  fetched_at: string;
  live_calls: LiveEarningsCall[];
  total_unique: number;
  sources_queried: string[];
}

const PATH_LIVE_EARNINGS_DB = path.join(DATA_DIR, "data-live-earnings-playwright.json");
const DEDUPLICATION_STORE = new Map<string, LiveEarningsCall>();

// Generate unique hash for deduplication
function generateCallHash(title: string, company?: string, source?: string): string {
  const normalized = `${title}|${company || ''}|${source || ''}`.toLowerCase().replace(/\s+/g, '');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function extractCompanyName(text: string): string | undefined {
  const patterns = [
    /^(.+?)\s*(?:-|:|–)\s*(?:Q[1-4]|Earnings|Results|Conference|Board)/i,
    /^([A-Z][A-Za-z0-9\s]+?)\s+(?:declares|announces|reports|hosts|posts)/i,
    /(?:for|of)\s+([A-Z][A-Za-z0-9\s]+?)(?:\s+(?:Q[1-4]|earnings|results)|\s*$)/i,
    /^([A-Z][A-Z0-9\s]+(?:LTD|LIMITED|CORP|INC|PVT)?)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 50);
    }
  }

  const words = text.split(/\s+/).filter(w => /^[A-Z]/.test(w));
  if (words.length >= 2) {
    return words.slice(0, 3).join(" ");
  }

  return undefined;
}

function determineCallType(title: string): LiveEarningsCall['type'] {
  const lower = title.toLowerCase();
  if (lower.includes('conference call') || lower.includes('earnings call')) return 'earnings_call';
  if (lower.includes('result') && lower.includes('announce')) return 'result_announcement';
  if (lower.includes('conference') || lower.includes('meet')) return 'conference';
  if (lower.includes('investor') || lower.includes('analyst')) return 'investor_meeting';
  return 'result_announcement';
}

function determinePriority(title: string): LiveEarningsCall['priority'] {
  const lower = title.toLowerCase();
  const highPriorityKeywords = ['live', 'ongoing', 'today', 'now', 'streaming'];
  const lowPriorityKeywords = ['scheduled', 'upcoming', 'later', 'postponed'];

  if (highPriorityKeywords.some(k => lower.includes(k))) return 'high';
  if (lowPriorityKeywords.some(k => lower.includes(k))) return 'low';
  return 'medium';
}

// IndStocks Live News Scraper
async function scrapeIndStocksLiveNews(): Promise<LiveEarningsCall[]> {
  const calls: LiveEarningsCall[] = [];
  let browser: Browser | null = null;

  try {
    console.log(`[IndStocks] Launching browser...`);
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-IN,en;q=0.9'
    });

    console.log(`[IndStocks] Navigating to IndStocks live news...`);
    await page.goto('https://www.indstocks.com/app/news/live-news/nifty-50', {
      waitUntil: 'networkidle',
      timeout: 45000
    });

    await page.waitForTimeout(4000);

    // Try multiple selectors for news items
    const selectors = [
      '[class*="news-item"]',
      '[class*="newsItem"]',
      '[class*="live-news"]',
      '[class*="article"]',
      '[class*="headline"]',
      'article',
      'li',
      'div[role="listitem"]',
      'div.card',
      'div[class*="card"]',
      'a[href*="news"]'
    ];

    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        console.log(`[IndStocks] Found ${elements.length} elements with selector: ${selector}`);

        for (const el of elements) {
          const text = normalize(await el.textContent() || '');

          if (text.length >= 15 && text.length <= 200) {
            const lowerText = text.toLowerCase();

            // Filter for earnings-related content
            if (lowerText.includes('result') ||
                lowerText.includes('earnings') ||
                lowerText.includes('conference') ||
                lowerText.includes('call') ||
                lowerText.includes('board meet') ||
                lowerText.includes('announc') ||
                lowerText.includes('declares') ||
                lowerText.includes('stock') ||
                lowerText.includes('share') ||
                lowerText.includes('quarterly') ||
                lowerText.includes('q1') ||
                lowerText.includes('q2') ||
                lowerText.includes('q3') ||
                lowerText.includes('q4')) {

              // Skip irrelevant content
              if (lowerText.includes('cookie') ||
                  lowerText.includes('privacy') ||
                  lowerText.includes('subscribe') ||
                  lowerText.includes('sign in')) {
                continue;
              }

              const company = extractCompanyName(text);
              const hash = generateCallHash(text, company, 'IndStocks');

              if (!DEDUPLICATION_STORE.has(hash)) {
                // Try to get link
                let link: string | undefined;
                const linkEl = await el.$('a');
                if (linkEl) {
                  link = await linkEl.getAttribute('href') || undefined;
                  if (link && !link.startsWith('http')) {
                    link = `https://www.indstocks.com${link}`;
                  }
                }

                const call: LiveEarningsCall = {
                  id: hash,
                  title: text,
                  timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  link,
                  company,
                  source: 'IndStocks',
                  type: determineCallType(text),
                  priority: determinePriority(text),
                  fetched_at: new Date().toISOString()
                };

                DEDUPLICATION_STORE.set(hash, call);
                calls.push(call);
                console.log(`[IndStocks] Found: "${text.substring(0, 60)}..."`);
              }
            }
          }

          if (calls.length >= 30) break;
        }
      } catch (err: any) {
        console.warn(`[IndStocks] Selector ${selector} failed: ${err.message}`);
      }

      if (calls.length >= 30) break;
    }

    // If few results, extract all text content from page
    if (calls.length < 5) {
      console.log(`[IndStocks] Few results, extracting all text content...`);
      try {
        const allText = await page.evaluate(() => {
          const texts: string[] = [];
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
          let node;
          while (node = walker.nextNode()) {
            const text = node.textContent?.trim();
            if (text && text.length > 15) {
              texts.push(text);
            }
          }
          return texts;
        });

        for (const text of allText) {
          const title = normalize(text);
          if (title.length >= 15 && title.length <= 200) {
            const lowerText = title.toLowerCase();

            if (lowerText.includes('result') ||
                lowerText.includes('earnings') ||
                lowerText.includes('announc') ||
                lowerText.includes('declares') ||
                lowerText.includes('stock')) {

              const company = extractCompanyName(title);
              const hash = generateCallHash(title, company, 'IndStocks');

              if (!DEDUPLICATION_STORE.has(hash)) {
                const call: LiveEarningsCall = {
                  id: hash,
                  title,
                  timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  company,
                  source: 'IndStocks',
                  type: determineCallType(title),
                  priority: determinePriority(title),
                  fetched_at: new Date().toISOString()
                };

                DEDUPLICATION_STORE.set(hash, call);
                calls.push(call);
              }
            }
          }

          if (calls.length >= 30) break;
        }
      } catch (err: any) {
        console.warn(`[IndStocks] All text extraction failed:`, err.message);
      }
    }

  } catch (err: any) {
    console.warn(`[IndStocks] Failed: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log(`[IndStocks] Total found: ${calls.length} earnings-related items`);
  return calls;
}

// Scrape using Playwright (better for JS-rendered pages)
async function scrapeWithPlaywright(url: string, selectors: string[], source: string): Promise<LiveEarningsCall[]> {
  const calls: LiveEarningsCall[] = [];
  let browser: Browser | null = null;

  try {
    console.log(`[Playwright] Launching browser for ${source}...`);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1366, height: 768 });

    // Set realistic headers
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    });

    console.log(`[Playwright] Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Try each selector
    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        console.log(`[Playwright] ${source}: Found ${elements.length} elements with selector: ${selector}`);

        for (const el of elements) {
          const text = normalize(await el.textContent() || '');

          if (text.length >= 15 && text.length <= 200) {
            const lowerText = text.toLowerCase();

            // Filter relevant content
            if (lowerText.includes('result') ||
                lowerText.includes('earning') ||
                lowerText.includes('conference') ||
                lowerText.includes('call') ||
                lowerText.includes('board meet') ||
                lowerText.includes('analyst') ||
                lowerText.includes('investor')) {

              const company = extractCompanyName(text);
              const hash = generateCallHash(text, company, source);

              // Check deduplication
              if (!DEDUPLICATION_STORE.has(hash)) {
                const call: LiveEarningsCall = {
                  id: hash,
                  title: text,
                  timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  link: url,
                  company,
                  source,
                  type: determineCallType(text),
                  priority: determinePriority(text),
                  fetched_at: new Date().toISOString()
                };

                DEDUPLICATION_STORE.set(hash, call);
                calls.push(call);
                console.log(`[Playwright] ${source}: Found "${text.substring(0, 60)}..."`);
              }
            }
          }

          if (calls.length >= 25) break; // Limit per source
        }
      } catch (err: any) {
        console.warn(`[Playwright] ${source}: Selector failed: ${err.message}`);
      }

      if (calls.length >= 25) break;
    }

  } catch (err: any) {
    console.warn(`[Playwright] ${source} failed: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return calls;
}

// Fallback HTTP scraping
async function scrapeWithHTTP(url: string, selectors: string[], source: string): Promise<LiveEarningsCall[]> {
  const calls: LiveEarningsCall[] = [];

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const text = normalize($(el).text());

        if (text.length >= 15 && text.length <= 200) {
          const lowerText = text.toLowerCase();

          if (lowerText.includes('result') ||
              lowerText.includes('earning') ||
              lowerText.includes('conference') ||
              lowerText.includes('call') ||
              lowerText.includes('board')) {

            const company = extractCompanyName(text);
            const hash = generateCallHash(text, company, source);

            if (!DEDUPLICATION_STORE.has(hash)) {
              const call: LiveEarningsCall = {
                id: hash,
                title: text,
                timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                link: url,
                company,
                source,
                type: determineCallType(text),
                priority: determinePriority(text),
                fetched_at: new Date().toISOString()
              };

              DEDUPLICATION_STORE.set(hash, call);
              calls.push(call);
            }
          }
        }

        if (calls.length >= 20) return false;
      });

      if (calls.length >= 20) break;
    }

  } catch (err: any) {
    console.warn(`[HTTP] ${source} failed: ${err.message}`);
  }

  return calls;
}

export async function scrapeLiveEarningsWithPlaywright(): Promise<LiveEarningsData> {
  console.log(`[Live Earnings] ========== STARTING ENHANCED LIVE EARNINGS SCRAPE ==========`);

  DEDUPLICATION_STORE.clear();

  const allCalls: LiveEarningsCall[] = [];
  const sourcesQueried: string[] = [];

  // Source 0: IndStocks Live News (PRIMARY - most real-time source)
  console.log(`[Live Earnings] Source 0: IndStocks Live News...`);
  sourcesQueried.push('IndStocks');
  try {
    const indstocksCalls = await scrapeIndStocksLiveNews();
    allCalls.push(...indstocksCalls);
    console.log(`[Live Earnings] IndStocks: Found ${indstocksCalls.length} calls`);
  } catch (err: any) {
    console.warn(`[Live Earnings] IndStocks failed: ${err.message}`);
  }

  // Source 1: Moneycontrol Earnings (most reliable for earnings calls)
  console.log(`[Live Earnings] Source 1: Moneycontrol Earnings...`);
  sourcesQueried.push('Moneycontrol');
  try {
    const mcCalls = await scrapeWithPlaywright(
      'https://www.moneycontrol.com/markets/earnings/',
      [
        'div.common_news_class a',
        'div.earning_updates a',
        '.news_item a',
        'div[class*="earning"] a',
        'ul.news_list li a'
      ],
      'Moneycontrol'
    );
    allCalls.push(...mcCalls);
    console.log(`[Live Earnings] Moneycontrol: Found ${mcCalls.length} calls`);
  } catch (err: any) {
    console.warn(`[Live Earnings] Moneycontrol failed: ${err.message}`);
  }

  // Source 2: BSE India Results
  if (allCalls.length < 30) {
    console.log(`[Live Earnings] Source 2: BSE India...`);
    sourcesQueried.push('BSE India');
    try {
      const bseCalls = await scrapeWithHTTP(
        'https://www.bseindia.com/corporates/Result.html',
        [
          'a',
          'td a',
          'tr td a'
        ],
        'BSE India'
      );
      allCalls.push(...bseCalls);
      console.log(`[Live Earnings] BSE: Found ${bseCalls.length} calls`);
    } catch (err: any) {
      console.warn(`[Live Earnings] BSE failed: ${err.message}`);
    }
  }

  // Source 3: NSE India Announcements
  if (allCalls.length < 30) {
    console.log(`[Live Earnings] Source 3: NSE India...`);
    sourcesQueried.push('NSE India');
    try {
      const nseCalls = await scrapeWithHTTP(
        'https://www.nseindia.com/companies-listing/securities-listed',
        [
          'a',
          'div.text a',
          'ul li a'
        ],
        'NSE India'
      );
      allCalls.push(...nseCalls);
      console.log(`[Live Earnings] NSE: Found ${nseCalls.length} calls`);
    } catch (err: any) {
      console.warn(`[Live Earnings] NSE failed: ${err.message}`);
    }
  }

  // Source 4: Economic Times Markets
  if (allCalls.length < 30) {
    console.log(`[Live Earnings] Source 4: Economic Times...`);
    sourcesQueried.push('Economic Times');
    try {
      const etCalls = await scrapeWithHTTP(
        'https://economictimes.indiatimes.com/markets/stocks/earnings',
        [
          'a[href*="result"]',
          'div.eachStory a',
          'article a',
          'a[data-ga*="earnings"]'
        ],
        'Economic Times'
      );
      allCalls.push(...etCalls);
      console.log(`[Live Earnings] ET: Found ${etCalls.length} calls`);
    } catch (err: any) {
      console.warn(`[Live Earnings] ET failed: ${err.message}`);
    }
  }

  // Source 5: Finology Ticker (always works)
  if (allCalls.length < 20) {
    console.log(`[Live Earnings] Source 5: Finology Ticker...`);
    sourcesQueried.push('Finology');
    try {
      const finCalls = await scrapeWithHTTP(
        'https://ticker.finology.in/',
        [
          "a.newslink[data-subsecname='EARNINGS']",
          'a.newslink',
          'div.news a'
        ],
        'Finology'
      );
      allCalls.push(...finCalls);
      console.log(`[Live Earnings] Finology: Found ${finCalls.length} calls`);
    } catch (err: any) {
      console.warn(`[Live Earnings] Finology failed: ${err.message}`);
    }
  }

  // Sort by priority and timestamp
  allCalls.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.fetched_at.localeCompare(a.fetched_at);
  });

  const data: LiveEarningsData = {
    fetched_at: new Date().toISOString(),
    live_calls: allCalls.slice(0, 50), // Top 50 unique calls
    total_unique: DEDUPLICATION_STORE.size,
    sources_queried: sourcesQueried
  };

  console.log(`[Live Earnings] ========== SCRAPE COMPLETE ==========`);
  console.log(`[Live Earnings] Total: ${allCalls.length} unique calls from ${sourcesQueried.length} sources`);

  // Save to cache
  try {
    fs.writeFileSync(PATH_LIVE_EARNINGS_DB, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[Live Earnings] Saved to cache: ${PATH_LIVE_EARNINGS_DB}`);
  } catch (err) {
    console.error(`[Live Earnings] Failed to save cache:`, err);
  }

  return data;
}

export function loadCachedLiveEarningsPlaywright(): LiveEarningsData | null {
  try {
    if (fs.existsSync(PATH_LIVE_EARNINGS_DB)) {
      const cached = JSON.parse(fs.readFileSync(PATH_LIVE_EARNINGS_DB, 'utf-8'));
      console.log(`[Live Earnings] Loaded cache: ${cached.live_calls?.length || 0} calls`);
      return cached;
    }
  } catch (err) {
    console.warn("[Live Earnings] Cache load failed:", err);
  }
  return null;
}
