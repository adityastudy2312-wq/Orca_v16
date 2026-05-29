import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { scrapeAllSources } from "./server-scraper";
import { scrapeAllEtfs } from "./server-etf-scraper";
import { scrapeGlobalMonitor } from "./server-global-scraper";
import { scrapeIndianIndices } from "./server-indian-indices-scraper";
import { scrapeFiiDiiActivity } from "./server-fii-dii-scraper";
import { scrapeNse500, getDetailedQuote } from "./server-nse500-scraper";
import { fetchAlphaVantageIndices } from "./server-alpha-vantage";
import { scrapeMoneycontrolEarnings, loadCachedEarnings } from "./server-earnings-scraper";
import { scrapeLiveEarningsCalls, loadCachedLiveEarnings } from "./server-live-earnings-scraper";
import { scrapeLiveEarningsWithPlaywright, loadCachedLiveEarningsPlaywright } from "./server-live-earnings-playwright";
import { scrapeMoneycontrolEarnings as scrapeMcEarningsPlaywright, loadCachedMoneycontrolEarnings } from "./server-moneycontrol-earnings";
import { scrapeMoneycontrolWorld, loadCachedMoneycontrolWorld } from "./server-moneycontrol-world";
import { scrapeAllNSEData, loadCachedNSEData, fetchNSEQuote, fetchNSEIPOs, fetchNSEOptionChain, fetchNSECorporateActions } from "./server-nse";
import { scrapeAllBSEData, loadCachedBSEData, fetchBSEQuote, fetchBSEResultCalendar, fetchBSEGainers, fetchBSELosers, fetchBSEAnnouncements } from "./server-bse";
import { scrapeIndStocks, loadCachedIndStocks } from "./server-indstocks-scraper";

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File paths for persistence
const PATH_SIGNALS = path.join(DATA_DIR, "data-signals.json");
const PATH_NEWS = path.join(DATA_DIR, "data-news.json");
const PATH_MODELS = path.join(DATA_DIR, "data-models.json");
const PATH_PIPELINE = path.join(DATA_DIR, "data-pipeline.json");
const PATH_ETFS = path.join(DATA_DIR, "data-etfs.json");
const PATH_GLOBAL_MONITOR = path.join(DATA_DIR, "data-global-monitor.json");
const PATH_INDIAN_INDICES = path.join(DATA_DIR, "data-indian-indices.json");
const PATH_FII_DII = path.join(DATA_DIR, "data-fii-dii.json");
const PATH_NSE500 = path.join(DATA_DIR, "data-nse500.json");
const PATH_EARNINGS = path.join(DATA_DIR, "data-earnings.json");

// Helper to write JSON safely
function saveDB(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Failed to write database to ${filePath}:`, err);
  }
}

// Helper to read JSON safely with defaults
function loadDB(filePath: string, defaultData: any) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Failed to read database from ${filePath}, using defaults:`, err);
  }
  // Initialize with default and return
  saveDB(filePath, defaultData);
  return defaultData;
}

// Load default databases
const defaultSignals = {
  tickers: [
    {
      symbol: "AAPL",
      company: "Apple Inc.",
      sector: "Technology Sector",
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_2nrGwFp3XTAJoT7zs8oKqMWliro6OMcFk6CivgEZ1VB1xUg7GRGLsxLPRRZJyDlWKjFjRoMKBHKWxTqHAIBC4xaFf8G6jIGSSTyBH6cz85OlgF98tXaB-oJjmvG5goVUrhGjm-aKPNZoQQ-msDDVPqjk_nTs5_SsgSGTqc1lBdp84609lkdziFmZzIcxvo9y3huTA9ikFJ2gmgx8eUrWvPzN5A8d5DD_IBX4kqPseAnUGZRIE8UWufdNF8W-PXLr9zDhYiXFSQSH",
      rating: "STRONG_BUY",
      price: 189.43,
      changeToday: 2.41,
      rsi: 62.58,
      ema200: "BULLISH",
      ema200Details: "+4.2% over avg",
      volFlow: "58.2M",
      volFlowDetails: "↑ High Demand",
      alphaScore: 92,
      sparkline: [120, 110, 140, 100, 120, 80, 110, 60, 130, 90, 40, 10],
    },
    {
      symbol: "NVDA",
      company: "NVIDIA Corp.",
      sector: "Semiconductors",
      logo: "bolt",
      rating: "BUY",
      price: 875.28,
      changeToday: 5.12,
      rsi: 58.20,
      ema200: "BULLISH",
      ema200Details: "+8.5% over avg",
      volFlow: "75.3M",
      volFlowDetails: "↑ Whale Demand",
      alphaScore: 88,
      volatility: "LOW",
      whaleFlow: "STRONG",
    },
    {
      symbol: "TSLA",
      company: "Tesla Inc.",
      sector: "Automotive & Energy",
      logo: "warning",
      rating: "REDUCE",
      price: 172.63,
      changeToday: -1.84,
      rsi: 34.15,
      ema200: "CRITICAL",
      ema200Details: "Breached support",
      volFlow: "42.1M",
      volFlowDetails: "↓ High Risk Zone",
      alphaScore: 41,
      riskText: "System identified major support breach at $175.00. High-risk zone.",
    },
    {
      symbol: "MSFT",
      company: "Microsoft Corp.",
      sector: "Cloud & Software",
      logo: "shield_with_heart",
      rating: "STABLE",
      price: 415.50,
      changeToday: 0.82,
      rsi: 51.40,
      ema200: "STABLE",
      ema200Details: "Slight Consolidation",
      volFlow: "28.5M",
      volFlowDetails: "Whale Accrual Active",
      alphaScore: 76,
      sentiment: "POSITIVE",
      sentimentBars: [5, 5, 5, 2.5, 1],
    },
  ],
  recalibration: {
    filters: [
      { id: "rsi_exhaustion", label: "RSI Exhaustion", active: true, value: "LVL_70+" },
      { id: "ma200_breakout", label: "MA_200 Breakout", active: true, value: "ACTIVE" },
      { id: "darkpool_flow", label: "Dark Pool Flow", active: false, value: "BYPASS" },
    ],
    confidence: 88.4,
  },
  exposures: [
    { name: "S&P 500", change: 1.12 },
    { name: "NASDAQ", change: 2.05 },
    { name: "RUSSELL", change: -0.41 },
    { name: "US10Y", change: 2.1, displayValue: "4.12%" },
  ],
};

const defaultNews = {
  featured: {
    title: "Global Yields Surge as Central Banks Pivot Toward Aggressive Tightening",
    source: "BLOOMBERG TERMINAL",
    ago: "4m ago",
    topic: "MACRO ECONOMY",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjv0RmZ8XdVqNvLrvGBxwPXzCvkLosybJFmMiSKms_0vUOaKTo8nnOCd4k8s359Ks7sp0fQllPXFCHOsxTJvZAbuHlZ_el1X2AXS6eP-oOq0jXLa53KDtyeJAabHASVwD6x1IXiBYpPEd2i74YDiqGxn-IHoP4vCKyo6ybzJUGa-8X9uaU58O40qUYuHgFo3Yrye7nunxjkdBZs2k70SZkEt89JjTgGPkWSp0j8EZXy7UkJXkpU71496WU55o1PLxDttYEpy3D5Itg",
    content: "Bond markets are experiencing historic volatility as unprecedented data suggests a hawkish stance from major central banks. Investors are recalibrating portfolios for a high-rate environment.",
  },
  feed: [
    {
      id: "news_1",
      topic: "EQUITIES",
      tagColor: "secondary",
      time: "12:45 UTC",
      title: "Tech Giants Face Regulatory Headwinds as Antitrust Laws Stiffen",
      summary: "New legislative proposals in the EU could fundamentally alter the data monetization models of top Silicon Valley firms...",
      source: "REUTERS",
      sourceLetter: "R",
    },
    {
      id: "news_2",
      topic: "CRYPTO",
      tagColor: "white",
      time: "12:30 UTC",
      title: "Institutional Bitcoin Inflows Hit Multi-Month Highs Amid ETF Speculation",
      summary: "Spot ETF approval rumors drive heavy volume across major derivatives exchanges as institutional desks move billions...",
      source: "COINDESK",
      sourceLetter: "C",
    },
    {
      id: "news_3",
      topic: "ENERGY",
      tagColor: "error",
      time: "12:12 UTC",
      title: "Oil Prices Spike as Supply Chain Disruptions Intensify",
      summary: "WTI Crude is trading elevated at $84.32 (+3.2%) with strong sentiment indicators suggesting structural limits.",
      source: "FT",
      sourceLetter: "F",
      extraMetric: {
        label: "WTI CRUDE",
        value: "$84.32 (+3.2%)",
        ticker: "WTI",
      },
    }
  ],
  suggested: [
    {
      type: "strategy",
      label: "STRATEGY ALERT",
      text: "New Arbitrage Model detected in EU/US energy futures.",
      actionLabel: "VIEW MODEL",
    },
    {
      type: "watchlist",
      label: "WATCHLIST HIT",
      text: "NVDA has breached 20-day EMA support levels.",
      actionLabel: "UPDATE ORDERS",
    }
  ],
  sentimentBars: [60, 45, 30, 55, 85, 100],
};

const defaultModels = {
  latency: [
    { name: "GPT-4 Omni", avgSec: 1.2, percent: 70 },
    { name: "Claude 3.5 Sonnet", avgSec: 0.8, percent: 40 },
    { name: "Llama 3 70B", avgSec: 0.4, percent: 20 },
  ],
  phases: [
    {
      id: "phase_1",
      name: "Signals Generation",
      meta: "Ingestion & Anomaly Detection",
      allocation: "llama-3",
      prompt: "You are an expert financial quant analyst. Scan incoming JSON streams for RSI divergence > 15% and MACD crossovers on 5m intervals. Flag high-volatility events for downstream analysis...",
      tokensUsed: 142,
      tokensMax: 4096,
    },
    {
      id: "phase_2",
      name: "Sentiment Analysis",
      meta: "Macro & Social Context",
      allocation: "claude-3",
      prompt: "Process headline data from Reuters and Bloomberg. Cross-reference with X (Twitter) sentiment flow for $BTC and $ETH. Output a normalized score between -1.0 and 1.0.",
      tokensUsed: 212,
      tokensMax: 8192,
    },
  ],
  retryCount: 3,
  autoEmbeddings: true,
  systemNodeInfo: {
    node: "AWS-USE-1A",
    ip: "172.24.9.102",
  },
};

const defaultPipeline = {
  mainMeta: {
    nodeId: "ORCA-16-MAIN-INF",
    elapsedTime: "00:14:52.39",
    memoryAllocated: "4.2 GB",
    memoryMax: "12 GB",
  },
  phases: [
    {
      id: "p1",
      number: "Phase_01",
      title: "Ingestion_Core",
      indicatorColor: "#00f0ff",
      progress: 100,
      status: "completed",
      metrics: [
        { label: "L2_OrderBook_Fetch", completed: true },
        { label: "WS_Stream_Sync", completed: true },
      ],
      liftLabel: "Data_Lift",
      liftPercent: 100,
    },
    {
      id: "p2",
      number: "Phase_02",
      title: "Feature_Set",
      indicatorColor: "#d1bcff",
      progress: 100,
      status: "completed",
      metrics: [
        { label: "VWAP_Compute", completed: true },
        { label: "Rolling_Vol_Calc", completed: true },
      ],
      liftLabel: "Engine_Eff",
      liftPercent: 94,
    },
    {
      id: "p3",
      number: "Phase_03",
      title: "Inference_Loop",
      indicatorColor: "#00f0ff",
      progress: 75,
      status: "running",
      metrics: [
        { label: "Orca_Transformer_V2", completed: true },
        { label: "Attention_Head_09", completed: "spinning" },
      ],
      liftLabel: "GPU_Sync",
      liftPercent: 78,
    },
    {
      id: "p4",
      number: "Phase_04",
      title: "Signal_Relay",
      indicatorColor: "#ffb4ab",
      progress: 40,
      status: "critical",
      metrics: [
        { label: "Gateway_Auth_Fail", completed: "fail" },
        { label: "Order_Dispatch", completed: "pause" },
      ],
      liftLabel: "Retry_Backoff",
      liftPercent: 40,
    },
  ],
  logs: [
    { time: "14:52:01", level: "INFO", message: "Initializing Orca_v16 weight tensors..." },
    { time: "14:52:04", level: "INFO", message: "Distributed compute handshake complete." },
    { time: "14:52:25", level: "EXEC", message: "Forward pass through Attention Head #09..." },
    { time: "14:52:45", level: "WARN", message: "Memory spill on node-7 (threshold 85%)." },
    { time: "14:52:50", level: "FAIL", message: "Gateway Auth Error (0x442) - Retrying." },
    { time: "14:52:52", level: "WAIT", message: "Cooling down node-7 for 5000ms..." }
  ],
};

const defaultEtfs = {
  etfs: [
    {
      symbol: "SPY",
      name: "SPDR S&P 500 ETF Trust",
      segment: "US Large Cap Equities",
      aum: "$502.4B",
      expenseRatio: "0.09%",
      rating: "STRONG_BUY",
      price: 512.20,
      changeToday: 0.45,
      rsi: 54.2,
      alphaScore: 84,
      riskAnalysis: "S&P 500 displays structural support alignment above the 50-day EMA. Volatility trends remain healthy with index whales increasing allocation flows by ~2.4% over current standard dev thresholds.",
      holdings: [
        { name: "Microsoft Corp (MSFT)", weight: 7.1 },
        { name: "Apple Inc (AAPL)", weight: 5.6 },
        { name: "NVIDIA Corp (NVDA)", weight: 5.0 },
        { name: "Amazon.com Inc (AMZN)", weight: 3.8 }
      ]
    },
    {
      symbol: "QQQ",
      name: "Invesco QQQ Trust",
      segment: "Tech-Growth Index",
      aum: "$254.1B",
      expenseRatio: "0.20%",
      rating: "BUY",
      price: 438.56,
      changeToday: 1.85,
      rsi: 64.8,
      alphaScore: 91,
      riskAnalysis: "High beta tech expansion displays substantial tailwinds with massive chipmaker-led inflows. Immediate attention ranges are bullish; RSI near exhaustion but momentum profiles signal continued runs.",
      holdings: [
        { name: "Microsoft Corp (MSFT)", weight: 8.8 },
        { name: "Apple Inc (AAPL)", weight: 7.9 },
        { name: "NVIDIA Corp (NVDA)", weight: 6.4 },
        { name: "Amazon.com Inc (AMZN)", weight: 4.9 }
      ]
    },
    {
      symbol: "ARKK",
      name: "ARK Innovation ETF",
      segment: "Disruptive Innovation Tech",
      aum: "$6.8B",
      expenseRatio: "0.75%",
      rating: "REDUCE",
      price: 42.15,
      changeToday: -2.40,
      rsi: 31.5,
      alphaScore: 38,
      riskAnalysis: "Disruptive technology basket experiences intensive liquidity spills amidst rising bond yields. Breached minor support levels at $44.00, placing risk metrics into a high risk zone. Caution warranted.",
      holdings: [
        { name: "Coinbase Global (COIN)", weight: 10.1 },
        { name: "Tesla Inc (TSLA)", weight: 8.2 },
        { name: "Roku Inc (ROKU)", weight: 7.5 },
        { name: "UiPath Inc (PATH)", weight: 6.1 }
      ]
    },
    {
      symbol: "GLD",
      name: "SPDR Gold Shares",
      segment: "Precious Metals Refuges",
      aum: "$58.2B",
      expenseRatio: "0.40%",
      rating: "BUY",
      price: 218.42,
      changeToday: 1.10,
      rsi: 58.5,
      alphaScore: 78,
      riskAnalysis: "Precious metal reserves display high active tracking indexes. Risk metrics indicate gold acts as a solid hedge for macro inflationary spikes and central bank bond tightening regimes.",
      holdings: [
        { name: "Gold Bullion (Spot Cash)", weight: 100.0 }
      ]
    },
    {
      symbol: "EEM",
      name: "iShares MSCI Emerging Markets ETF",
      segment: "Global & Emerging Markets",
      aum: "$25.5B",
      expenseRatio: "0.70%",
      rating: "STABLE",
      price: 40.85,
      changeToday: -0.15,
      rsi: 46.1,
      alphaScore: 62,
      riskAnalysis: "Emerging markets consolidate in a strict range bound setup. High relative chip exposure via regional semiconductor giants is balancing local currency risks.",
      holdings: [
        { name: "TSMC (Taiwan Semi)", weight: 8.2 },
        { name: "Tencent Holdings", weight: 5.4 },
        { name: "Alibaba Group", weight: 4.1 }
      ]
    },
    {
      symbol: "VXX",
      name: "Barclays iPath VIX short-term ETN",
      segment: "Volatility Hedging Index",
      aum: "$1.2B",
      expenseRatio: "0.89%",
      rating: "STABLE",
      price: 14.28,
      changeToday: -3.12,
      rsi: 28.4,
      alphaScore: 45,
      riskAnalysis: "Volatility index hovering near lifetime lows as index equity accruals remain robust. Great hedge entry bands established, though speculative carries should be heavily size-controlled.",
      holdings: [
        { name: "S&P 500 VIX Short Futures", weight: 100.0 }
      ]
    }
  ],
  globalFlowStatus: "INSTITUTIONAL ACCRUEL ACTIVE",
  lastUpdated: "Just Now",
  scrapedCategories: [],
  lastScrapedAt: ""
};

// Lazy initialization check
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const defaultGlobalMonitor = {
  bloomberg: {
    source: "Bloomberg",
    url: "https://www.bloomberg.com/asia",
    scraped_at: "2026-05-27T04:40:22Z",
    market_tickers: [],
    top_stories: [],
    latest_news: []
  },
  reuters: {
    source: "Reuters",
    url: "https://www.reuters.com/world/",
    scraped_at: "2026-05-27T04:40:22Z",
    section: "World",
    top_stories: []
  },
  worldmonitor: {
    scraped_at: "2026-05-27T11:21:55Z",
    markets: [
      {
        title: "S&P 500 Defies Headwinds to Eye All-Time Highs Amid Core Semi Momentum",
        url: "https://finance.yahoo.com/rss/topstories",
        source: "Yahoo Finance",
        timestamp: "May 27, 2026",
        category: "Markets News",
        summary: "Tech index triggers massive buying pressure across premium AI hardware nodes, overriding minor concerns over persistent central bank hawkishness."
      },
      {
        title: "Treasury Yield Curve Constrains Financial Sector Growth Plans",
        url: "https://seekingalpha.com/market_currents.xml",
        source: "SeekingAlpha",
        timestamp: "May 27, 2026",
        category: "Markets News",
        summary: "Short-term funding pressures continue to exert downward pressure on regional lending margins, forcing tactical high-yield reallocation structures."
      }
    ],
    forex: [
      {
        title: "DXY Dollar Index Firms Near 105.20 Post Durable Goods Surges",
        url: "https://news.google.com/rss/search?q=DXY",
        source: "WorldMonitor RSS",
        timestamp: "May 27, 2026",
        category: "Forex & Currencies",
        summary: "Robust US macroeconomic resilience supports long-duration dollar holding, capping immediate recoveries for European and Japanese counterparts."
      },
      {
        title: "Yen Consolidates Near Critical Intervention Benchmarks Amid BoJ Speculation",
        url: "https://news.google.com/rss/search?q=forex",
        source: "Reuters",
        timestamp: "May 27, 2026",
        category: "Forex & Currencies",
        summary: "Market participants expect currency authorities to execute active treasury support should dollar-yen exchange test immediate overhead boundaries."
      }
    ],
    commodities: [
      {
        title: "Crude WTI Fluctuates Near $78 as OPEC Extends Voluntary Supply Guidelines",
        url: "https://news.google.com/rss/search?q=oil",
        source: "Marketwatch",
        timestamp: "May 27, 2026",
        category: "Commodities News",
        summary: "Strategic product cuts keep a secure floor under Brent crude despite rising inventory counts in North American distribution terminals."
      },
      {
        title: "Precious Metals Breakout Confirmed with Spot Gold Retesting $2,350",
        url: "https://news.google.com/rss/search?q=gold",
        source: "Bloomberg",
        timestamp: "May 27, 2026",
        category: "Commodities News",
        summary: "Safe haven flows accelerate as global asset allocation switches toward inflation-proof hedges and physical commodity alternatives."
      }
    ]
  },
  global_indices: []
};

// REST API endpoints
// REST API endpoints
app.get("/api/gnews/search", async (req, res) => {
  const { q, lang, country, sortby, max, apikey } = req.query;
  if (!apikey) {
    return res.status(400).json({ error: "GNews API Key is required." });
  }
  try {
    const query = q || "example";
    const language = lang || "en";
    const cntry = country || "any";
    const sort = sortby || "publishedAt";
    const mx = max || 10;
    
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(String(query))}&lang=${language}&country=${cntry}&sortby=${sort}&max=${mx}&apikey=${apikey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `GNews API responded with status ${response.status}: ${errorText}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("GNews search proxy error:", error);
    res.status(500).json({ error: error.message || "Failed to search GNews API via server proxy" });
  }
});

app.get("/api/nse500", async (req, res) => {
  try {
    const data = await scrapeNse500(false);
    res.json(data);
  } catch (error: any) {
    console.error("Failed to load NSE 500:", error);
    res.status(500).json({ error: error.message || "Failed to load NSE 500 list" });
  }
});

app.post("/api/nse500/scrape", async (req, res) => {
  try {
    const data = await scrapeNse500(true);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Failed to scrape NSE 500:", error);
    res.status(500).json({ error: error.message || "Failed to trigger live NSE 500 scrape" });
  }
});

app.get("/api/nse500/quote", async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required" });
  }
  try {
    const quote = await getDetailedQuote(String(symbol));
    if (!quote) {
      return res.status(404).json({ error: "Symbol quote not found or live fetch failed" });
    }
    res.json(quote);
  } catch (error: any) {
    console.error(`Failed to load detailed quote for ${symbol}:`, error);
    res.status(500).json({ error: error.message || "Failed to load detailed quote" });
  }
});

app.get("/api/global-monitor", (req, res) => {
  const db = loadDB(PATH_GLOBAL_MONITOR, defaultGlobalMonitor);
  res.json(db);
});

app.post("/api/global-monitor/scrape", async (req, res) => {
  const alphaKey = String(req.query.alpha_key || "").trim();
  try {
    const scrapedData = await scrapeGlobalMonitor();
    const db = loadDB(PATH_GLOBAL_MONITOR, defaultGlobalMonitor);

    // Merge only successful scrapes to prevent empty tables if rate-limited or blocked
    let updated = false;
    if (scrapedData && scrapedData.bloomberg && scrapedData.bloomberg.top_stories && scrapedData.bloomberg.top_stories.length > 0) {
      db.bloomberg = scrapedData.bloomberg;
      updated = true;
    }
    if (scrapedData && scrapedData.reuters && scrapedData.reuters.top_stories && scrapedData.reuters.top_stories.length > 0) {
      db.reuters = scrapedData.reuters;
      updated = true;
    }
    if (scrapedData && scrapedData.worldmonitor && (scrapedData.worldmonitor.markets.length > 0 || scrapedData.worldmonitor.forex.length > 0 || scrapedData.worldmonitor.commodities.length > 0)) {
      db.worldmonitor = scrapedData.worldmonitor;
      updated = true;
    }

    let alphaMsg: string | undefined;
    if (alphaKey) {
      try {
        console.log(`[Server] Initiating Alpha Vantage live index run...`);
        const alphaResult = await fetchAlphaVantageIndices(alphaKey);
        db.global_indices = alphaResult.indices;
        if (alphaResult.message) {
          alphaMsg = alphaResult.message;
        }
        updated = true;
      } catch (err: any) {
        console.warn("[Server] Alpha Vantage dynamic query failed:", err.message);
        // We propagate the actual error directly so that user sees rate limitations or invalid credentials
        return res.status(400).json({ error: err.message });
      }
    }

    if (updated) {
      saveDB(PATH_GLOBAL_MONITOR, db);
    }
    res.json({ success: true, db, alpha_message: alphaMsg });
  } catch (err: any) {
    console.error("Global scraping failed:", err);
    res.status(500).json({ error: err.message || "Failed to scrape global monitor" });
  }
});

const defaultIndianIndices = {
  fetched_at: new Date().toISOString(),
  indices: [
    { name: "NIFTY 50", symbol: "NIFTY 50", last_price: 23512.65, change: 120.45, percent_change: 0.51, open: 23390.20, high: 23544.15, low: 23378.50, previous_close: 23392.20 },
    { name: "NIFTY NEXT 50", symbol: "NIFTY NEXT 50", last_price: 68124.40, change: -241.15, percent_change: -0.35, open: 68365.55, high: 68420.00, low: 67980.15, previous_close: 68365.55 },
    { name: "NIFTY BANK", symbol: "NIFTY BANK", last_price: 49120.50, change: 334.80, percent_change: 0.69, open: 48785.70, high: 49210.45, low: 48750.30, previous_close: 48785.70 },
    { name: "NIFTY FINANCIAL SERVICES", symbol: "NIFTY FIN SERVICE", last_price: 22894.10, change: 154.20, percent_change: 0.68, open: 22739.90, high: 22920.00, low: 22710.40, previous_close: 22739.90 },
    { name: "NIFTY MIDCAP 50", symbol: "NIFTY MIDCAP 50", last_price: 15412.30, change: -45.10, percent_change: -0.29, open: 15457.40, high: 15490.15, low: 15380.00, previous_close: 15457.40 },
    { name: "NIFTY AUTO", symbol: "NIFTY AUTO", last_price: 21940.85, change: 212.10, percent_change: 0.98, open: 21728.75, high: 22010.50, low: 21712.00, previous_close: 21728.75 },
    { name: "NIFTY IT", symbol: "NIFTY IT", last_price: 36712.45, change: -188.35, percent_change: -0.51, open: 36900.80, high: 36980.50, low: 36540.20, previous_close: 36900.80 },
    { name: "NIFTY METAL", symbol: "NIFTY METAL", last_price: 9410.20, change: 84.15, percent_change: 0.90, open: 9326.05, high: 9450.40, low: 9310.15, previous_close: 9326.05 },
    { name: "NIFTY PHARMA", symbol: "NIFTY PHARMA", last_price: 19124.60, change: 48.30, percent_change: 0.25, open: 19076.30, high: 19190.80, low: 19050.15, previous_close: 19076.30 },
    { name: "NIFTY INFRASTRUCTURE", symbol: "NIFTY INFRA", last_price: 8412.15, change: 12.45, percent_change: 0.15, open: 8399.70, high: 8440.50, low: 8380.10, previous_close: 8399.70 },
    { name: "NIFTY ENERGY", symbol: "NIFTY ENERGY", last_price: 38942.30, change: -510.45, percent_change: -1.29, open: 39452.75, high: 39510.80, low: 38850.15, previous_close: 39452.75 }
  ]
};

app.get("/api/indian-indices", (req, res) => {
  const db = loadDB(PATH_INDIAN_INDICES, defaultIndianIndices);
  res.json(db);
});

app.post("/api/indian-indices/scrape", async (req, res) => {
  try {
    const scrapedData = await scrapeIndianIndices();
    saveDB(PATH_INDIAN_INDICES, scrapedData);
    res.json({ success: true, db: scrapedData });
  } catch (err: any) {
    console.error("Indian indices scraping failed:", err);
    res.status(500).json({ error: err.message || "Failed to scrape Indian indices" });
  }
});

const defaultFiiDii = {
  fetched_at: new Date().toISOString(),
  source: "web.stockedge.com (Bootloader)",
  activities: [
    { date: "2026-05-27", fii_cash_net: -1520.40, dii_cash_net: 2410.80, fii_index_futures_net: -340.50, fii_index_options_net: 12450.20, fii_stock_futures_net: 820.60, fii_stock_options_net: -150.30, market_sentiment: "bullish" },
    { date: "2026-05-26", fii_cash_net: -940.25, dii_cash_net: 1845.30, fii_index_futures_net: 450.20, fii_index_options_net: -8900.50, fii_stock_futures_net: -210.40, fii_stock_options_net: 45.10, market_sentiment: "neutral" },
    { date: "2026-05-25", fii_cash_net: -2150.80, dii_cash_net: 3120.40, fii_index_futures_net: -110.30, fii_index_options_net: 15400.90, fii_stock_futures_net: 1430.70, fii_stock_options_net: -410.20, market_sentiment: "bullish" },
    { date: "2026-05-22", fii_cash_net: 450.15, dii_cash_net: 980.50, fii_index_futures_net: 890.10, fii_index_options_net: -4500.20, fii_stock_futures_net: 610.30, fii_stock_options_net: 120.45, market_sentiment: "bullish" },
    { date: "2026-05-21", fii_cash_net: -840.60, dii_cash_net: 1540.20, fii_index_futures_net: -520.40, fii_index_options_net: 10890.30, fii_stock_futures_net: -140.20, fii_stock_options_net: -85.10, market_sentiment: "neutral" }
  ]
};

app.get("/api/fii-dii", (req, res) => {
  const db = loadDB(PATH_FII_DII, defaultFiiDii);
  res.json(db);
});

app.post("/api/fii-dii/scrape", async (req, res) => {
  try {
    const scrapedData = await scrapeFiiDiiActivity();
    saveDB(PATH_FII_DII, scrapedData);
    res.json({ success: true, db: scrapedData });
  } catch (err: any) {
    console.error("FII/DII activity scraping failed:", err);
    res.status(500).json({ error: err.message || "Failed to scrape FII/DII flow" });
  }
});

// ========== EARNINGS CALENDAR API ==========

app.get("/api/earnings", (req, res) => {
  const cached = loadCachedEarnings();
  if (cached) {
    res.json(cached);
  } else {
    res.json({
      fetched_at: new Date().toISOString(),
      result_calendar: [],
      rapid_results: [],
      earnings_updates: [],
      sector_performers: [],
      market_snapshots: [],
      price_shocker: []
    });
  }
});

app.post("/api/earnings/scrape", async (req, res) => {
  try {
    const scrapedData = await scrapeMoneycontrolEarnings();
    saveDB(PATH_EARNINGS, scrapedData);
    res.json({ success: true, data: scrapedData });
  } catch (err: any) {
    console.error("Earnings scraping failed:", err);
    res.status(500).json({ error: err.message || "Failed to scrape earnings data" });
  }
});

// ========== LIVE EARNINGS CALLS API ==========

app.get("/api/live-earnings", (req, res) => {
  // Try Playwright-enhanced version first, fallback to basic
  const cachedPlaywright = loadCachedLiveEarningsPlaywright();
  if (cachedPlaywright) {
    res.json(cachedPlaywright);
  } else {
    const cached = loadCachedLiveEarnings();
    if (cached) {
      res.json(cached);
    } else {
      res.json({
        fetched_at: new Date().toISOString(),
        live_calls: []
      });
    }
  }
});

app.post("/api/live-earnings/scrape", async (req, res) => {
  try {
    const usePlaywright = req.query.playwright !== 'false';
    if (usePlaywright) {
      console.log("[Server] Using Playwright-enhanced live earnings scraper...");
      const scrapedData = await scrapeLiveEarningsWithPlaywright();
      res.json({ success: true, data: scrapedData, engine: 'playwright' });
    } else {
      const scrapedData = await scrapeLiveEarningsCalls();
      res.json({ success: true, data: scrapedData, engine: 'basic' });
    }
  } catch (err: any) {
    console.error("Live earnings scraping failed:", err);
    res.status(500).json({ error: err.message || "Failed to scrape live earnings data" });
  }
});

// ========== LIVE EARNINGS SSE (SERVER-SENT EVENTS) ==========

const liveEarningsClients = new Set<any>();
let liveEarningsPollInterval: NodeJS.Timeout | null = null;

app.get("/api/live-earnings/stream", (req, res) => {
  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Add client to set
  liveEarningsClients.add(res);

  // Send initial data
  const cached = loadCachedLiveEarningsPlaywright() || loadCachedLiveEarnings();
  if (cached) {
    res.write(`data: ${JSON.stringify({ type: 'initial', data: cached })}\n\n`);
  } else {
    res.write(`data: ${JSON.stringify({ type: 'initial', data: { fetched_at: new Date().toISOString(), live_calls: [] } })}\n\n`);
  }

  // Start polling if not already running
  if (!liveEarningsPollInterval) {
    startLiveEarningsPolling();
  }

  // Heartbeat every 15 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    liveEarningsClients.delete(res);
    console.log(`[Live Earnings SSE] Client disconnected. Active clients: ${liveEarningsClients.size}`);

    // Stop polling if no clients
    if (liveEarningsClients.size === 0 && liveEarningsPollInterval) {
      clearInterval(liveEarningsPollInterval);
      liveEarningsPollInterval = null;
      console.log('[Live Earnings SSE] No clients, stopping polling');
    }
  });

  console.log(`[Live Earnings SSE] Client connected. Active clients: ${liveEarningsClients.size}`);
});

function startLiveEarningsPolling() {
  const POLL_INTERVAL = 60000; // Poll every 60 seconds

  console.log(`[Live Earnings SSE] Starting polling interval: ${POLL_INTERVAL / 1000}s`);

  liveEarningsPollInterval = setInterval(async () => {
    if (liveEarningsClients.size === 0) {
      console.log('[Live Earnings SSE] No clients, skipping poll');
      return;
    }

    try {
      console.log('[Live Earnings SSE] Polling for updates...');
      const data = await scrapeLiveEarningsWithPlaywright();

      const message = JSON.stringify({
        type: 'update',
        data,
        timestamp: new Date().toISOString()
      });

      // Broadcast to all connected clients
      liveEarningsClients.forEach(client => {
        try {
          client.write(`data: ${message}\n\n`);
        } catch (err) {
          console.warn('[Live Earnings SSE] Failed to send to client, removing');
          liveEarningsClients.delete(client);
        }
      });

      console.log(`[Live Earnings SSE] Update sent to ${liveEarningsClients.size} clients`);
    } catch (err: any) {
      console.error('[Live Earnings SSE] Polling error:', err.message);
    }
  }, POLL_INTERVAL);

  // Trigger immediate scrape on start
  scrapeLiveEarningsWithPlaywright().catch(err => {
    console.error('[Live Earnings SSE] Initial scrape error:', err.message);
  });
}

// ========== INDSTOCKS LIVE NEWS SCRAPER API ==========

const PATH_INDSTOCKS = path.join(DATA_DIR, "data-indstocks-live.json");

app.get("/api/indstocks-live", (req, res) => {
  const cached = loadCachedIndStocks();
  if (cached) {
    res.json(cached);
  } else {
    res.json({
      fetched_at: new Date().toISOString(),
      source: "IndStocks",
      url: "https://www.indstocks.com/app/news/live-news/nifty-50",
      items: [],
      total_items: 0,
      earnings_calls: [],
      market_updates: [],
      corporate_actions: []
    });
  }
});

app.post("/api/indstocks-live/scrape", async (req, res) => {
  try {
    console.log("[Server] Starting IndStocks Live News Playwright scrape...");
    const scrapedData = await scrapeIndStocks();
    saveDB(PATH_INDSTOCKS, scrapedData);
    res.json({ success: true, data: scrapedData });
  } catch (err: any) {
    console.error("IndStocks scraping failed:", err);
    res.status(500).json({ error: err.message || "Failed to scrape IndStocks live news" });
  }
});

// ========== MONEYCONTROL EARNINGS (PLAYWRIGHT) API ==========

const PATH_MC_EARNINGS = path.join(DATA_DIR, "data-moneycontrol-earnings.json");
const PATH_MC_WORLD = path.join(DATA_DIR, "data-moneycontrol-world.json");

app.get("/api/moneycontrol-earnings", (req, res) => {
  const cached = loadCachedMoneycontrolEarnings();
  if (cached) {
    res.json(cached);
  } else {
    res.json({
      fetched_at: new Date().toISOString(),
      source: "MoneyControl Earnings (Playwright)",
      upcoming_results: [],
      declared_results: [],
      top_performers: [],
      news_headlines: []
    });
  }
});

app.post("/api/moneycontrol-earnings/scrape", async (req, res) => {
  try {
    console.log("[Server] Starting MoneyControl Earnings Playwright scrape...");
    const scrapedData = await scrapeMcEarningsPlaywright();
    saveDB(PATH_MC_EARNINGS, scrapedData);
    res.json({ success: true, data: scrapedData });
  } catch (err: any) {
    console.error("MoneyControl Earnings Playwright scraping failed:", err);
    res.status(500).json({ error: err.message || "Failed to scrape MoneyControl Earnings" });
  }
});

// ========== MONEYCONTROL WORLD NEWS API ==========

app.get("/api/moneycontrol-world", (req, res) => {
  const cached = loadCachedMoneycontrolWorld();
  if (cached) {
    res.json(cached);
  } else {
    res.json({
      fetched_at: new Date().toISOString(),
      source: "MoneyControl World",
      url: "https://www.moneycontrol.com/world/",
      featured_articles: [],
      latest_news: [],
      market_updates: []
    });
  }
});

app.post("/api/moneycontrol-world/scrape", async (req, res) => {
  try {
    console.log("[Server] Starting MoneyControl World Playwright scrape...");
    const scrapedData = await scrapeMoneycontrolWorld();
    saveDB(PATH_MC_WORLD, scrapedData);
    res.json({ success: true, data: scrapedData });
  } catch (err: any) {
    console.error("MoneyControl World scraping failed:", err);
    res.status(500).json({ error: err.message || "Failed to scrape MoneyControl World" });
  }
});

// ========== NSE API ENDPOINTS ==========

const PATH_NSE_DATA = path.join(DATA_DIR, "data-nse.json");
const PATH_BSE_DATA = path.join(DATA_DIR, "data-bse.json");

app.get("/api/nse", (req, res) => {
  const cached = loadCachedNSEData();
  if (cached) {
    res.json(cached);
  } else {
    res.json({
      fetched_at: new Date().toISOString(),
      source: "NSE India",
      market_status: null,
      top_gainers: [],
      top_losers: [],
      ipos: [],
      announcements: []
    });
  }
});

app.post("/api/nse/scrape", async (req, res) => {
  try {
    console.log("[Server] Starting NSE data fetch...");
    const data = await scrapeAllNSEData();
    saveDB(PATH_NSE_DATA, data);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("NSE fetch failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch NSE data" });
  }
});

app.get("/api/nse/quote/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const quote = await fetchNSEQuote(symbol);
    if (quote) {
      res.json(quote);
    } else {
      res.status(404).json({ error: "Quote not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/nse/option-chain/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol || "NIFTY";
    const chain = await fetchNSEOptionChain(symbol);
    res.json({ symbol, data: chain });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== BSE API ENDPOINTS ==========

app.get("/api/bse", (req, res) => {
  const cached = loadCachedBSEData();
  if (cached) {
    res.json(cached);
  } else {
    res.json({
      fetched_at: new Date().toISOString(),
      source: "BSE India",
      top_gainers: [],
      top_losers: [],
      result_calendar: [],
      corporate_actions: [],
      announcements: []
    });
  }
});

app.post("/api/bse/scrape", async (req, res) => {
  try {
    console.log("[Server] Starting BSE data fetch...");
    const data = await scrapeAllBSEData();
    saveDB(PATH_BSE_DATA, data);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("BSE fetch failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch BSE data" });
  }
});

app.get("/api/bse/quote/:scripCode", async (req, res) => {
  try {
    const scripCode = req.params.scripCode;
    const quote = await fetchBSEQuote(scripCode);
    if (quote) {
      res.json(quote);
    } else {
      res.status(404).json({ error: "Quote not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/bse/result-calendar", async (req, res) => {
  try {
    const calendar = await fetchBSEResultCalendar();
    res.json(calendar);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/bse/gainers", async (req, res) => {
  try {
    const gainers = await fetchBSEGainers();
    res.json(gainers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/bse/losers", async (req, res) => {
  try {
    const losers = await fetchBSELosers();
    res.json(losers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/etfs", (req, res) => {
  const db = loadDB(PATH_ETFS, defaultEtfs);
  res.json(db);
});

app.post("/api/etfs/scrape", async (req, res) => {
  try {
    const scrapedData = await scrapeAllEtfs();
    const db = loadDB(PATH_ETFS, defaultEtfs);
    
    db.scrapedCategories = scrapedData;
    db.lastScrapedAt = new Date().toISOString();
    
    saveDB(PATH_ETFS, db);
    res.json({ success: true, db });
  } catch (err: any) {
    console.error("ETF scraping failed:", err);
    res.status(500).json({ error: err.message || "Failed to scrape ETFs" });
  }
});

app.post("/api/etfs/rebalance", (req, res) => {
  const db = loadDB(PATH_ETFS, defaultEtfs);
  
  // Simulated rebalancing logic: fluctuate prices slightly and modify weights to show active state
  db.etfs = db.etfs.map((etf: any) => {
    let multiplier = 1 + (Math.random() - 0.5) * 0.04;
    etf.price = +(etf.price * multiplier).toFixed(2);
    etf.changeToday = +(etf.changeToday + (Math.random() - 0.5) * 0.6).toFixed(2);
    etf.rsi = Math.min(99, Math.max(10, +(etf.rsi + (Math.random() - 0.5) * 4).toFixed(2)));
    etf.alphaScore = Math.min(100, Math.max(10, Math.floor(etf.alphaScore + (Math.random() - 0.5) * 6)));
    
    // adjust holdings weights slightly
    if (etf.holdings.length > 1) {
      let total = 0;
      etf.holdings.forEach((h: any) => {
        h.weight = +(h.weight + (Math.random() - 0.5) * 0.5).toFixed(1);
        if (h.weight < 0.5) h.weight = 0.5;
        total += h.weight;
      });
    }
    return etf;
  });
  
  db.globalFlowStatus = Math.random() > 0.5 ? "REBALANCING COMPLETED" : "HEAVY ASSET ROTATION DETECTED";
  db.lastUpdated = new Date().toLocaleTimeString() + " UTC";
  saveDB(PATH_ETFS, db);
  res.json({ success: true, db });
});

app.post("/api/etfs/analyze", async (req, res) => {
  const { symbol } = req.body;
  const db = loadDB(PATH_ETFS, defaultEtfs);
  const etf = db.etfs.find((e: any) => e.symbol === symbol);

  if (!etf) {
    return res.status(404).json({ error: "ETF not found" });
  }

  const client = getGeminiClient();
  if (!client) {
    // Elegant fallback if no apiKey is available
    const backupReport = `[Backup Analytical Core] ${etf.name} (${etf.symbol}) evaluated at price $${etf.price}. Current technical indicator RSI stands at ${etf.rsi}. Sector focus is highly aligned with risk metrics. The institutional alpha scoring is ${etf.alphaScore}/100. Recommend standard DCA allocations.`;
    etf.riskAnalysis = backupReport;
    saveDB(PATH_ETFS, db);
    return res.json({ success: true, db, riskAnalysis: backupReport, warning: "Gemini API key is not configured, using cached local system diagnostic." });
  }

  try {
    const prompt = `You are a Principal ETF Capital Allocator at ORCA terminal. 
Analyze this Global ETF for active capital flows and risk metrics:
Symbol: ${etf.symbol}
Name: ${etf.name}
Segment/Theme: ${etf.segment}
Assets Under Management: ${etf.aum}
Expense Ratio: ${etf.expenseRatio}
Current RSI: ${etf.rsi}
Alpha Score: ${etf.alphaScore}
Holdings: ${JSON.stringify(etf.holdings)}

Generate a high-density, concise institutional-grade risk analysis and structural allocation outlook (around 50-70 words). Output ONLY the clean analysis, do not include introduction tags or conversation wraps.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    const report = response.text?.trim() || "Consolidated parameters returned stable active tracking bounds.";
    etf.riskAnalysis = report;
    saveDB(PATH_ETFS, db);
    res.json({ success: true, db, riskAnalysis: report });
  } catch (err: any) {
    console.error("ETF analyze failure:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI analysis." });
  }
});

app.get("/api/signals", (req, res) => {
  const db = loadDB(PATH_SIGNALS, defaultSignals);
  res.json(db);
});

app.post("/api/signals/recalibrate", (req, res) => {
  const db = loadDB(PATH_SIGNALS, defaultSignals);
  const { filters, confidence } = req.body;
  if (filters) db.recalibration.filters = filters;
  if (confidence !== undefined) db.recalibration.confidence = confidence;

  // Let's randomize tickers slightly to show "recalibration in progress"
  db.tickers = db.tickers.map((t: any) => {
    let multiplier = 1 + (Math.random() - 0.5) * 0.05;
    let oldPrice = t.price;
    t.price = +(t.price * multiplier).toFixed(2);
    t.changeToday = +(t.changeToday + (Math.random() - 0.5) * 0.5).toFixed(2);
    t.rsi = Math.min(99, Math.max(10, +(t.rsi + (Math.random() - 0.5) * 5).toFixed(2)));
    t.alphaScore = Math.min(100, Math.max(0, Math.floor(t.alphaScore + (Math.random() - 0.5) * 10)));
    return t;
  });

  saveDB(PATH_SIGNALS, db);
  res.json({ success: true, db });
});

function mapScrapedToDefaultNews(scrapedData: any, existingNews: any) {
  const result = {
    ...existingNews,
    scraped: scrapedData,
  };

  const allArticles: any[] = [];
  const zerodha = scrapedData.sources.find((s: any) => s.source === "zerodha_pulse");
  const moneycontrol = scrapedData.sources.find((s: any) => s.source === "moneycontrol_world");
  const tickertape = scrapedData.sources.find((s: any) => s.source === "tickertape_us_stocks");

  // Moneycontrol detailed articles
  if (moneycontrol && moneycontrol.articles && moneycontrol.articles.length > 0) {
    moneycontrol.articles.forEach((art: any, i: number) => {
      allArticles.push({
        id: `scraped_mc_${i}_${Date.now()}`,
        topic: "WORLD MARKET",
        tagColor: "secondary",
        time: art.published_at || "Recent",
        title: art.title,
        summary: art.summary || "Real-time international market intelligence bulletin scraped from Moneycontrol World terminal.",
        source: "MONEYCONTROL",
        sourceLetter: "M",
        url: art.url,
        image: art.imageUrl,
      });
    });
  }

  // Zerodha compact pulse articles
  if (zerodha && zerodha.articles && zerodha.articles.length > 0) {
    zerodha.articles.forEach((art: any, i: number) => {
      allArticles.push({
        id: `scraped_zp_${i}_${Date.now()}`,
        topic: "INDIAN MACRO",
        tagColor: "white",
        time: art.published_at || "Recent",
        title: art.title,
        summary: art.summary || "Interactive micro-indicator flow alert.",
        source: "ZERODHA PULSE",
        sourceLetter: "Z",
        url: art.url,
      });
    });
  }

  // Override feed and featured if we gathered any articles
  if (allArticles.length > 0) {
    const firstDetail = allArticles.find((a: any) => a.image) || allArticles[0];
    result.featured = {
      title: firstDetail.title,
      source: firstDetail.source.toUpperCase(),
      ago: firstDetail.time,
      topic: firstDetail.topic,
      image: firstDetail.image || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1000",
      content: firstDetail.summary,
    };

    // Override feed
    result.feed = allArticles.slice(0, 15);
  }

  // TickerTape asset changes can override suggested indicators
  if (tickertape && tickertape.articles && tickertape.articles.length > 0) {
    result.suggested = tickertape.articles.slice(0, 5).map((art: any, i: number) => ({
      type: "watchlist",
      label: "SCRAPED VOLATILITY TARGET",
      text: `${art.asset} experiences live deviation of ${art.change >= 0 ? "+" : ""}${art.change.toFixed(2)}%`,
      actionLabel: art.change >= 0 ? "LONG ALLOCATION" : "HEDGE COVERS",
    }));
  }

  return result;
}

app.get("/api/news", (req, res) => {
  const db = loadDB(PATH_NEWS, defaultNews);
  
  // Asynchronously trigger scrape on load if no active scraped data or older than 1 hour
  const shouldScrapeOnLoad = !db.scraped || !db.scraped.scraped_at || (Date.now() - new Date(db.scraped.scraped_at).getTime() > 1000 * 60 * 60);
  if (shouldScrapeOnLoad) {
    scrapeAllSources().then((scrapedData) => {
      const refreshedDb = loadDB(PATH_NEWS, defaultNews);
      const mapped = mapScrapedToDefaultNews(scrapedData, refreshedDb);
      saveDB(PATH_NEWS, mapped);
    }).catch(err => {
      console.error("Async background scrape failed:", err);
    });
  }

  res.json(db);
});

app.post("/api/news/scrape", async (req, res) => {
  try {
    const scrapedData = await scrapeAllSources();
    const db = loadDB(PATH_NEWS, defaultNews);
    const mapped = mapScrapedToDefaultNews(scrapedData, db);
    saveDB(PATH_NEWS, mapped);
    res.json({ success: true, db: mapped });
  } catch (error: any) {
    console.error("Manual scrape endpoint error:", error);
    res.status(500).json({ error: error.message || "Failed to parse active news." });
  }
});

// Real Gemini-powered news analyzer!
app.post("/api/news/analyze-market", async (req, res) => {
  const { context } = req.body;
  const client = getGeminiClient();

  if (!client) {
    return res.status(503).json({
      error: "Gemini API Key is not configured or invalid in active secrets settings.",
    });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert institutional market commentator at ORCA Terminal. 
Analyze these current trends: "${context || "All Markets"}".
Generate a high-density institutional bulletin consisting of:
1. A headline (8-12 words, bold, uppercase, dramatic, e.g. 'LIQUIDITY SQUEEZE DETECTED...')
2. A short market impact (1 paragraph, professional, technical prose)
Format the output as JSON matching:
{
  "title": "...",
  "content": "..."
}`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    // Update the DB's featured story!
    const db = loadDB(PATH_NEWS, defaultNews);
    db.featured.title = parsed.title || "ORCA ALIGNMENT STRETCHES REGIME INTENSITY";
    db.featured.content = parsed.content || "Market trends have shifted with neural models evaluating custom scenarios.";
    db.featured.ago = "Just Now";
    db.featured.topic = "AI INTELLIGENCE";

    // Insert a feed item as well
    db.feed.unshift({
      id: "news_" + Date.now(),
      topic: "AI ALIGNMENT",
      tagColor: "secondary",
      time: new Date().toISOString().substring(11, 16) + " UTC",
      title: parsed.title,
      summary: parsed.content.substring(0, 100) + "...",
      source: "ORCA NETWORK",
      sourceLetter: "O",
    });

    saveDB(PATH_NEWS, db);
    res.json({ success: true, featured: db.featured, feed: db.feed });
  } catch (error: any) {
    console.error("Gemini context generation failure:", error);
    res.status(500).json({ error: error.message || "Failed to query Gemini model." });
  }
});

app.get("/api/pipeline", (req, res) => {
  const db = loadDB(PATH_PIPELINE, defaultPipeline);
  res.json(db);
});

// Appending simulated pipeline logs
app.post("/api/pipeline/reboot", (req, res) => {
  const db = loadDB(PATH_PIPELINE, defaultPipeline);
  db.logs.push({
    time: new Date().toISOString().substring(11, 19),
    level: "INFO",
    message: "Manual pipeline reset triggered. Recalibrating state allocation...",
  });
  db.logs.push({
    time: new Date().toISOString().substring(11, 19),
    level: "EXEC",
    message: "Handshake established. Loading weights onto node AWS-USE-1A.",
  });
  // Clear any critical state slightly
  db.phases[3].status = "completed";
  db.phases[3].progress = 100;
  db.phases[3].metrics[0].completed = "done_all";
  db.phases[3].metrics[1].completed = "done_all";

  saveDB(PATH_PIPELINE, db);
  res.json({ success: true, db });
});

app.get("/api/models", (req, res) => {
  const db = loadDB(PATH_MODELS, defaultModels);
  res.json(db);
});

app.post("/api/models/commit", (req, res) => {
  const { phases, retryCount, autoEmbeddings } = req.body;
  const db = loadDB(PATH_MODELS, defaultModels);

  if (phases) db.phases = phases;
  if (retryCount !== undefined) db.retryCount = retryCount;
  if (autoEmbeddings !== undefined) db.autoEmbeddings = autoEmbeddings;

  saveDB(PATH_MODELS, db);
  res.json({ success: true, db });
});

// Refine system prompts with Gemini integration
app.post("/api/models/optimize-prompt", async (req, res) => {
  const { phaseId, currentPrompt } = req.body;
  const client = getGeminiClient();

  if (!client) {
    return res.status(503).json({
      error: "Gemini API Key is not configured. Please supply it under Secrets panel.",
    });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a Principal AI Architect at ORCA Terminal. 
Given this financial analysis prompt: "${currentPrompt}".
Optimize it to be exceptionally high-fidelity, explicit about parameters, with formatting directives for numerical formats (e.g. JSON), and lower token consumption.
Output ONLY the optimized prompt itself, do not add conversational greetings, introduction tags, or formatting brackets.`,
    });

    const optimized = response.text?.trim() || currentPrompt;

    // Update models db
    const db = loadDB(PATH_MODELS, defaultModels);
    db.phases = db.phases.map((p: any) => {
      if (p.id === phaseId) {
        p.prompt = optimized;
        p.tokensUsed = Math.floor(optimized.length / 4); // basic calculation
      }
      return p;
    });

    saveDB(PATH_MODELS, db);
    res.json({ success: true, optimized, db });
  } catch (err: any) {
    console.error("Optimize prompt mismatch:", err);
    res.status(500).json({ error: err.message || "Failed to optimize prompt." });
  }
});

// Boot the Dev or Production pipeline
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server boots on port ${PORT}`);
  });
}

startServer();
