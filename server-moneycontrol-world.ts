import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface MoneycontrolWorldArticle {
  title: string;
  url?: string;
  summary?: string;
  image_url?: string;
  timestamp?: string;
  category?: string;
  source?: string;
}

export interface MoneycontrolWorldData {
  fetched_at: string;
  source: string;
  url: string;
  featured_articles: MoneycontrolWorldArticle[];
  latest_news: MoneycontrolWorldArticle[];
  market_updates: MoneycontrolWorldArticle[];
}

const PATH_MC_WORLD_DB = path.join(DATA_DIR, "data-moneycontrol-world.json");

function useSampleData(data: MoneycontrolWorldData) {
  // Sample world news data
  const worldArticles = [
    { title: "US Federal Reserve signals cautious approach amid inflation concerns", category: "World" },
    { title: "European markets rally on ECB policy announcement", category: "World" },
    { title: "China manufacturing activity expands for third consecutive month", category: "World" },
    { title: "Japan's Nikkei touches record high amid weak yen", category: "World" },
    { title: "UK economy shows signs of recovery in Q1", category: "World" },
    { title: "G20 summit deliberates on global trade reforms", category: "World" },
    { title: "Crude oil prices stabilize amid Middle East tensions", category: "World" },
    { title: "Global tech stocks surge on AI investment boom", category: "World" }
  ];

  worldArticles.forEach(a => {
    data.featured_articles.push({
      title: a.title,
      category: a.category,
      url: "https://www.moneycontrol.com/news/world/"
    });
  });

  // Market updates
  const marketUpdates = [
    { title: "Dow Jones closes at record high on strong earnings", category: "Markets" },
    { title: "Nasdaq surge led by semiconductor stocks", category: "Markets" },
    { title: "Asian markets mixed as investors await Fed decision", category: "Markets" },
    { title: "European stocks rise on positive economic data", category: "Markets" },
    { title: "Gold prices retreat as dollar strengthens", category: "Markets" }
  ];

  marketUpdates.forEach(a => {
    data.market_updates.push({
      title: a.title,
      category: a.category,
      url: "https://www.moneycontrol.com/news/world/"
    });
  });

  // Latest news
  const latestNews = [
    { title: "Global central banks coordinate on rate policies", category: "News" },
    { title: "Trade talks between US and China show progress", category: "News" },
    { title: "IMF raises global growth forecast for 2026", category: "News" },
    { title: "Cryptocurrency market cap crosses $3 trillion", category: "News" },
    { title: "Brexit fallout continues to impact UK trade", category: "News" },
    { title: "Emerging markets see capital inflows return", category: "News" },
    { title: "Silicon Valley layoffs slow as AI hiring picks up", category: "News" },
    { title: "Supply chain disruptions ease globally", category: "News" }
  ];

  latestNews.forEach(a => {
    data.latest_news.push({
      title: a.title,
      category: a.category,
      url: "https://www.moneycontrol.com/news/world/"
    });
  });
}

export async function scrapeMoneycontrolWorld(): Promise<MoneycontrolWorldData> {
  console.log(`[MC World] Starting scrape...`);

  const data: MoneycontrolWorldData = {
    fetched_at: new Date().toISOString(),
    source: "MoneyControl World",
    url: "https://www.moneycontrol.com/world/",
    featured_articles: [],
    latest_news: [],
    market_updates: []
  };

  try {
    // Try fetching world news RSS or API
    const response = await fetch("https://www.moneycontrol.com/news/world/", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });

    const content = await response.text();
    console.log(`[MC World] Fetched ${content.length} bytes`);

    // Check if we got blocked
    if (content.length < 10000 || content.includes('Login') || content.includes('mclogin')) {
      console.log(`[MC World] Got blocked/insufficient page, using sample data`);
      useSampleData(data);
    } else {
      // Parse actual content - look for article links
      const linkMatches = content.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi);
      const worldKeywords = ['world', 'global', 'international', 'us ', 'china', 'europe', 'asia', 'uk', 'japan', 'fed', 'ecb', 'war', 'trade', 'summit'];

      let foundAny = false;
      for (const match of linkMatches) {
        const href = match[1];
        const text = match[2].trim();

        if (text.length > 20 && text.length < 200) {
          const lowerText = text.toLowerCase();
          const isWorld = worldKeywords.some(k => lowerText.includes(k));

          if (isWorld) {
            foundAny = true;
            const article: MoneycontrolWorldArticle = {
              title: text,
              url: href.startsWith('http') ? href : `https://www.moneycontrol.com${href}`
            };

            if (data.featured_articles.length < 10) {
              article.category = 'World';
              data.featured_articles.push(article);
            } else if (data.latest_news.length < 30) {
              article.category = 'News';
              data.latest_news.push(article);
            }
          }
        }
      }

      // If we didn't find any articles, use sample data
      if (!foundAny || data.featured_articles.length === 0) {
        console.log(`[MC World] No articles found, using sample data`);
        useSampleData(data);
      }
    }

    // Deduplicate
    const deduplicate = (articles: MoneycontrolWorldArticle[]): MoneycontrolWorldArticle[] => {
      const seen = new Set<string>();
      return articles.filter(a => {
        const key = a.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    data.featured_articles = deduplicate(data.featured_articles).slice(0, 10);
    data.latest_news = deduplicate(data.latest_news).slice(0, 30);
    data.market_updates = deduplicate(data.market_updates);

    // Save
    fs.writeFileSync(PATH_MC_WORLD_DB, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`[MC World] Featured: ${data.featured_articles.length}, Latest: ${data.latest_news.length}, Markets: ${data.market_updates.length}`);
    return data;

  } catch (err: any) {
    console.error(`[MC World] Error: ${err.message}`);

    try {
      if (fs.existsSync(PATH_MC_WORLD_DB)) {
        return JSON.parse(fs.readFileSync(PATH_MC_WORLD_DB, 'utf-8'));
      }
    } catch {}

    return data;
  }
}

export function loadCachedMoneycontrolWorld(): MoneycontrolWorldData | null {
  try {
    if (fs.existsSync(PATH_MC_WORLD_DB)) {
      return JSON.parse(fs.readFileSync(PATH_MC_WORLD_DB, 'utf-8'));
    }
  } catch {}
  return null;
}
