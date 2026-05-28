import * as cheerio from "cheerio";

export const NEWS_TARGET_URLS = [
  "https://pulse.zerodha.com/",
  "https://www.tickertape.in/us-stocks",
  "https://www.moneycontrol.com/world/",
];

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch {
    return relativeUrl;
  }
}

function parseAssetChangeTitle(title: string): { asset: string; change: number } | null {
  const normalized = normalize(title).replace(/â–²/g, "▲").replace(/â–¼/g, "▼");
  let asset = "";
  let sign = 1;
  let changeText = "";

  if (normalized.includes(" ▲")) {
    const parts = normalized.split(" ▲");
    asset = parts[0];
    sign = 1;
    changeText = parts[1];
  } else if (normalized.includes(" ▼")) {
    const parts = normalized.split(" ▼");
    asset = parts[0];
    sign = -1;
    changeText = parts[1];
  } else if (normalized.includes("▲")) {
    const parts = normalized.split("▲");
    asset = parts[0];
    sign = 1;
    changeText = parts[1];
  } else if (normalized.includes("▼")) {
    const parts = normalized.split("▼");
    asset = parts[0];
    sign = -1;
    changeText = parts[1];
  } else {
    return null;
  }

  const match = changeText.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!match) return null;
  const changeVal = parseFloat(match[0]);
  if (isNaN(changeVal)) return null;

  return {
    asset: asset.trim(),
    change: sign * changeVal
  };
}

function collectZerodhaPulseArticles(html: string): any[] {
  const $ = cheerio.load(html);
  const articles: any[] = [];
  const seen = new Set<string>();

  $("li.box.item").each((_, item) => {
    const titleNode = $(item).find("h2.title a");
    if (titleNode.length === 0) return;

    const url = titleNode.attr("href") || "";
    const title = normalize(titleNode.text());
    if (title.length < 18 || seen.has(url)) return;
    seen.add(url);

    const summaryNode = $(item).find(".desc");
    const summary = summaryNode.length > 0 ? normalize(summaryNode.text()) : undefined;

    const dateNode = $(item).find(".date");
    const published_at = dateNode.attr("title") || normalize(dateNode.text()) || undefined;

    articles.push({
      type: "PulseCompact",
      title,
      url,
      summary,
      published_at,
    });

    // Similar articles
    $(item).find("ul.similar li").each((_, similar) => {
      const similarTitleNode = $(similar).find("a.title2");
      if (similarTitleNode.length === 0) return;

      const similarUrl = similarTitleNode.attr("href") || "";
      const similarTitle = normalize(similarTitleNode.text());
      if (similarTitle.length < 18 || seen.has(similarUrl)) return;
      seen.add(similarUrl);

      const simDateNode = $(similar).find(".date");
      const simPublishedAt = simDateNode.attr("title") || normalize(simDateNode.text()) || published_at;

      articles.push({
        type: "PulseCompact",
        title: similarTitle,
        url: similarUrl,
        summary: undefined,
        published_at: simPublishedAt,
      });
    });
  });

  // Fallback if specific classes changed
  if (articles.length === 0) {
    $("a").each((_, anchor) => {
      const href = $(anchor).attr("href") || "";
      const title = normalize($(anchor).text());
      if (title.length >= 18 && !seen.has(href) && (href.startsWith("http") || href.includes("pulse"))) {
        seen.add(href);
        articles.push({
          type: "PulseCompact",
          title,
          url: href,
          summary: undefined,
          published_at: new Date().toLocaleTimeString() + " UTC",
        });
      }
    });
  }

  return articles;
}

function collectMoneycontrolWorldArticles(html: string, baseUrl: string): any[] {
  const $ = cheerio.load(html);
  const articles: any[] = [];
  const seen = new Set<string>();

  $("li.clearfix").each((_, item) => {
    const anchor = $(item).find("a").first();
    if (anchor.length === 0) return;

    const href = anchor.attr("href") || "";
    if (!href) return;
    const articleUrl = resolveUrl(baseUrl, href);

    const h2Node = $(item).find("h2");
    let title = h2Node.length > 0 ? normalize(h2Node.text()) : normalize(anchor.text());

    if (!title || title.length < 10) return;

    if (seen.has(articleUrl)) return;
    seen.add(articleUrl);

    const descNode = $(item).find("p");
    const summary = descNode.length > 0 ? normalize(descNode.text()) : undefined;

    const imgNode = $(item).find("img");
    let imageUrl = imgNode.attr("data-src") || imgNode.attr("src") || undefined;
    if (imageUrl) {
      imageUrl = resolveUrl(baseUrl, imageUrl);
    }

    articles.push({
      type: "Detailed",
      title,
      url: articleUrl,
      summary,
      imageUrl,
      published_at: undefined,
      publisher: "Moneycontrol World",
      article_kind: "article",
    });
  });

  // General fallback of any moneycontrol news link
  if (articles.length === 0) {
    $("a").each((_, anchor) => {
      const href = $(anchor).attr("href") || "";
      if (!href) return;
      const articleUrl = resolveUrl(baseUrl, href);

      if (articleUrl.includes("/news/") && articleUrl.endsWith(".html")) {
        const title = normalize($(anchor).text());
        if (title.length >= 18 && !seen.has(articleUrl)) {
          seen.add(articleUrl);
          articles.push({
            type: "Detailed",
            title,
            url: articleUrl,
            summary: undefined,
            publisher: "Moneycontrol World",
            article_kind: "article",
          });
        }
      }
    });
  }

  return articles;
}

function collectTickertapeUsStockChanges(html: string): any[] {
  const $ = cheerio.load(html);
  const articles: any[] = [];
  const seen = new Set<string>();

  $("a, span, div, td").each((_, elem) => {
    const text = normalize($(elem).text());
    const matched = parseAssetChangeTitle(text);
    if (!matched) return;

    const lowerAsset = matched.asset.toLowerCase();
    if (seen.has(lowerAsset) || lowerAsset.length < 2 || lowerAsset.length > 50) return;
    seen.add(lowerAsset);

    articles.push({
      type: "AssetChange",
      asset: matched.asset,
      change: matched.change,
    });
  });

  return articles;
}

export async function scrapeNewsSource(url: string): Promise<any> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        error: {
          kind: "bad_status",
          url,
          status: res.status,
          message: `Received status code ${res.status}`
        }
      };
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const pageTitle = $("title").text().trim() || null;

    let articles: any[] = [];
    if (url.includes("zerodha.com")) {
      articles = collectZerodhaPulseArticles(html);
    } else if (url.includes("moneycontrol.com")) {
      articles = collectMoneycontrolWorldArticles(html, url);
    } else if (url.includes("tickertape.in")) {
      articles = collectTickertapeUsStockChanges(html);
    }

    if (articles.length === 0) {
      return {
        error: {
          kind: "parse",
          url,
          message: "No news articles or asset changes matches found on the webpage html output."
        }
      };
    }

    return {
      source: url.includes("zerodha") ? "zerodha_pulse" : url.includes("moneycontrol") ? "moneycontrol_world" : "tickertape_us_stocks",
      url,
      status: res.status,
      fetched_at: new Date().toISOString(),
      page_title: pageTitle,
      articles,
    };
  } catch (err: any) {
    return {
      error: {
        kind: "request",
        url,
        message: err.message || "Failed to make HTTP connections to the server."
      }
    };
  }
}

export async function scrapeAllSources(): Promise<any> {
  const items = await Promise.all(NEWS_TARGET_URLS.map(url => scrapeNewsSource(url)));
  
  const sources: any[] = [];
  const errors: any[] = [];

  for (const item of items) {
    if (item.error) {
      errors.push(item.error);
    } else {
      sources.push(item);
    }
  }

  return {
    scraped_at: new Date().toISOString(),
    sources,
    errors,
  };
}
