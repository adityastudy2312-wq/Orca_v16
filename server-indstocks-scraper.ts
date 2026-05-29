import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface IndStocksNewsItem {
  id: string;
  title: string;
  summary?: string;
  timestamp: string;
  source: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  link?: string;
  company?: string;
  fetched_at: string;
}

export interface IndStocksLiveData {
  fetched_at: string;
  source: string;
  url: string;
  items: IndStocksNewsItem[];
  total_items: number;
  earnings_calls: IndStocksNewsItem[];
  market_updates: IndStocksNewsItem[];
  corporate_actions: IndStocksNewsItem[];
}

const PATH_INDSTOCKS_DB = path.join(DATA_DIR, "data-indstocks-live.json");

function generateItemHash(title: string, timestamp: string): string {
  const normalized = `${title}|${timestamp}`.toLowerCase().replace(/\s+/g, '');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function extractCompanyFromTitle(title: string): string | undefined {
  // Common patterns for company mentions in news
  const patterns = [
    /^([A-Z][A-Za-z0-9\s]+?)\s*(?:-|:|>|•)/i,
    /(?:^|\s)([A-Z][A-Z0-9\s]+(?:LTD|LIMITED|CORP|INC|PVT)?)/i,
    /(?:for|of)\s+([A-Z][A-Za-z0-9\s]+?)(?:\s+(?:Q[1-4]|earnings|results)|\s*$)/i
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1] && match[1].length > 2 && match[1].length < 50) {
      return match[1].trim();
    }
  }

  return undefined;
}

function categorizeItem(title: string): { category: string; priority: 'high' | 'medium' | 'low' } {
  const lower = title.toLowerCase();

  // Earnings calls and results
  if (lower.includes('earnings call') ||
      lower.includes('result announce') ||
      lower.includes('board meet') ||
      lower.includes('q1') || lower.includes('q2') ||
      lower.includes('q3') || lower.includes('q4')) {
    return { category: 'earnings_call', priority: 'high' };
  }

  // Corporate actions
  if (lower.includes('dividend') ||
      lower.includes('bonus') ||
      lower.includes('split') ||
      lower.includes('buyback') ||
      lower.includes('rights issue')) {
    return { category: 'corporate_action', priority: 'medium' };
  }

  // Market updates
  if (lower.includes('market') ||
      lower.includes('index') ||
      lower.includes('nifty') ||
      lower.includes('sensex')) {
    return { category: 'market_update', priority: 'medium' };
  }

  // Default
  return { category: 'general_news', priority: 'low' };
}

function determinePriority(title: string): 'high' | 'medium' | 'low' {
  const lower = title.toLowerCase();
  const highKeywords = ['live', 'breaking', 'urgent', 'just in', 'alert', 'result'];
  const mediumKeywords = ['announced', 'declared', 'scheduled', 'upcoming'];

  if (highKeywords.some(k => lower.includes(k))) return 'high';
  if (mediumKeywords.some(k => lower.includes(k))) return 'medium';
  return 'low';
}

async function scrapeIndStocksWithPlaywright(): Promise<IndStocksLiveData> {
  console.log('[IndStocks Scraper] ========== STARTING SCRAPE ==========');

  let browser: Browser | null = null;
  const items: IndStocksNewsItem[] = [];

  try {
    console.log('[IndStocks Scraper] Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-IN',
      timezoneId: 'Asia/Kolkata'
    });

    const page = await context.newPage();

    console.log('[IndStocks Scraper] Navigating to IndStocks...');
    await page.goto('https://www.indstocks.com/app/news/live-news/nifty-50', {
      waitUntil: 'networkidle',
      timeout: 45000
    });

    // Wait for the page to fully load
    console.log('[IndStocks Scraper] Waiting for content to load...');
    await page.waitForTimeout(5000);

    // Try to find and click any "Load More" buttons
    try {
      const loadMoreButton = await page.$('button:has-text("Load")');
      if (loadMoreButton) {
        console.log('[IndStocks Scraper] Clicking Load More...');
        await loadMoreButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      // Ignore if no load more button
    }

    // Take a screenshot for debugging
    const screenshotPath = path.join(DATA_DIR, 'indstocks-debug.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[IndStocks Scraper] Screenshot saved to ${screenshotPath}`);

    // Extract page title and URL
    const pageTitle = await page.title();
    console.log(`[IndStocks Scraper] Page title: ${pageTitle}`);

    // Try multiple selectors for news items
    const selectors = [
      // Common news card selectors
      '[class*="news-item"]',
      '[class*="newsItem"]',
      '[class*="news-card"]',
      '[class*="newsCard"]',
      '[class*="article"]',
      '[class*="story"]',
      '[class*="feed-item"]',
      '[class*="feedItem"]',

      // Generic list items
      'div[class*="list"] > div',
      'ul > li',
      'article',
      '[role="listitem"]',

      // IndStocks specific (guesses based on common patterns)
      '.live-news-item',
      '.news-title',
      '.headline',
      '.item-title',

      // Any clickable elements with text
      'a[href*="news"]',
      'a[href*="article"]',
      'a[href*="story"]',

      // Divs with substantial text content
      'div:has(> h2), div:has(> h3), div:has(> h4)',
      'div:has(> span), div:has(> p)'
    ];

    const seenItems = new Set<string>();

    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        console.log(`[IndStocks Scraper] Found ${elements.length} elements with selector: ${selector}`);

        for (const element of elements) {
          try {
            // Get all text content from the element
            const textContent = await element.textContent();
            if (!textContent) continue;

            const title = normalize(textContent);

            // Filter out non-news items
            if (title.length < 15 || title.length > 300) continue;

            // Skip navigation, headers, footers
            const lowerText = title.toLowerCase();
            if (lowerText.includes('cookie') ||
                lowerText.includes('privacy') ||
                lowerText.includes('subscribe') ||
                lowerText.includes('sign in') ||
                lowerText.includes('log in') ||
                lowerText.includes('footer') ||
                lowerText.includes('header') ||
                lowerText.includes('menu')) {
              continue;
            }

            // Look for stock-related content
            const isRelevant = lowerText.includes('result') ||
                              lowerText.includes('earnings') ||
                              lowerText.includes('stock') ||
                              lowerText.includes('share') ||
                              lowerText.includes('price') ||
                              lowerText.includes('market') ||
                              lowerText.includes('nifty') ||
                              lowerText.includes('sensex') ||
                              lowerText.includes('investor') ||
                              lowerText.includes('announce') ||
                              lowerText.includes('declares') ||
                              lowerText.includes('board') ||
                              lowerText.includes('dividend') ||
                              lowerText.includes('bonus') ||
                              lowerText.includes('split') ||
                              lowerText.includes('ipo') ||
                              lowerText.includes('quarterly') ||
                              lowerText.includes('q1') ||
                              lowerText.includes('q2') ||
                              lowerText.includes('q3') ||
                              lowerText.includes('q4');

            if (isRelevant) {
              // Try to get timestamp
              let timestamp = new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
              });

              // Try to find time element
              const timeElement = await element.$('time, [class*="time"], [class*="date"]');
              if (timeElement) {
                const timeText = await timeElement.textContent();
                if (timeText) {
                  timestamp = normalize(timeText);
                }
              }

              // Try to get link
              let link: string | undefined;
              const linkElement = await element.$('a');
              if (linkElement) {
                link = await linkElement.getAttribute('href') || undefined;
                if (link && !link.startsWith('http')) {
                  link = `https://www.indstocks.com${link}`;
                }
              }

              const hash = generateItemHash(title, timestamp);

              if (!seenItems.has(hash)) {
                seenItems.add(hash);

                const company = extractCompanyFromTitle(title);
                const categorization = categorizeItem(title);

                const item: IndStocksNewsItem = {
                  id: hash,
                  title,
                  timestamp,
                  source: 'IndStocks',
                  category: categorization.category,
                  priority: categorization.priority,
                  link,
                  company,
                  fetched_at: new Date().toISOString()
                };

                items.push(item);
                console.log(`[IndStocks Scraper] Found: "${title.substring(0, 80)}..."`);
              }
            }

            if (items.length >= 100) break; // Limit
          } catch (itemErr: any) {
            // Skip failed items
          }
        }

        if (items.length >= 100) break;
      } catch (selErr: any) {
        console.warn(`[IndStocks Scraper] Selector ${selector} failed:`, selErr.message);
      }

      if (items.length >= 100) break;
    }

    // If we found items, try to get their HTML structure for better parsing
    if (items.length > 0 && items.length < 10) {
      console.log('[IndStocks Scraper] Found few items, trying to extract more from page structure...');

      try {
        // Get all text content from the page and parse
        const bodyContent = await page.evaluate(() => {
          const body = document.body;
          const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
          const texts: string[] = [];
          let node;
          while (node = walker.nextNode()) {
            const text = node.textContent?.trim();
            if (text && text.length > 10) {
              texts.push(text);
            }
          }
          return texts;
        });

        // Process body content
        for (const text of bodyContent) {
          const title = normalize(text);
          if (title.length >= 15 && title.length <= 300) {
            const lowerText = title.toLowerCase();

            const isRelevant = lowerText.includes('result') ||
                                lowerText.includes('earnings') ||
                                lowerText.includes('stock') ||
                                lowerText.includes('share') ||
                                lowerText.includes('market');

            if (isRelevant) {
              const hash = generateItemHash(title, new Date().toLocaleTimeString());

              if (!seenItems.has(hash)) {
                seenItems.add(hash);

                const company = extractCompanyFromTitle(title);
                const categorization = categorizeItem(title);

                const item: IndStocksNewsItem = {
                  id: hash,
                  title,
                  timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  source: 'IndStocks',
                  category: categorization.category,
                  priority: categorization.priority,
                  company,
                  fetched_at: new Date().toISOString()
                };

                items.push(item);
              }
            }
          }

          if (items.length >= 100) break;
        }
      } catch (err: any) {
        console.warn('[IndStocks Scraper] Body extraction failed:', err.message);
      }
    }

  } catch (err: any) {
    console.error('[IndStocks Scraper] Error:', err.message);
    console.error('[IndStocks Scraper] Stack:', err.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Categorize items
  const earningsCalls = items.filter(i => i.category === 'earnings_call');
  const marketUpdates = items.filter(i => i.category === 'market_update');
  const corporateActions = items.filter(i => i.category === 'corporate_action');

  const data: IndStocksLiveData = {
    fetched_at: new Date().toISOString(),
    source: 'IndStocks',
    url: 'https://www.indstocks.com/app/news/live-news/nifty-50',
    items,
    total_items: items.length,
    earnings_calls: earningsCalls,
    market_updates: marketUpdates,
    corporate_actions: corporateActions
  };

  console.log(`[IndStocks Scraper] ========== SCRAPE COMPLETE ==========`);
  console.log(`[IndStocks Scraper] Total: ${items.length} items`);
  console.log(`[IndStocks Scraper] Earnings calls: ${earningsCalls.length}`);
  console.log(`[IndStocks Scraper] Market updates: ${marketUpdates.length}`);
  console.log(`[IndStocks Scraper] Corporate actions: ${corporateActions.length}`);

  // Save to cache
  try {
    fs.writeFileSync(PATH_INDSTOCKS_DB, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[IndStocks Scraper] Saved to cache: ${PATH_INDSTOCKS_DB}`);
  } catch (err) {
    console.error('[IndStocks Scraper] Failed to save cache:', err);
  }

  return data;
}

export function loadCachedIndStocks(): IndStocksLiveData | null {
  try {
    if (fs.existsSync(PATH_INDSTOCKS_DB)) {
      const cached = JSON.parse(fs.readFileSync(PATH_INDSTOCKS_DB, 'utf-8'));
      console.log(`[IndStocks Scraper] Loaded cache: ${cached.items?.length || 0} items`);
      return cached;
    }
  } catch (err) {
    console.warn("[IndStocks Scraper] Cache load failed:", err);
  }
  return null;
}

export { scrapeIndStocksWithPlaywright as scrapeIndStocks };
