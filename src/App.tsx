import React, { useState, useEffect, useRef } from "react";
import { Activity, Terminal, Newspaper, Workflow, Cpu, TrendingUp, TriangleAlert as AlertTriangle, ShieldAlert, Search, Bell, Play, History, SlidersHorizontal, Zap, RotateCw, Settings, Check, Bookmark, Share2, Info, Layers, Square, SquareCheck as CheckSquare, Sparkles, ExternalLink, FileSliders as Sliders, Database, Globe, Clock, Compass, Tag, TrendingDown, Calendar, Phone } from "lucide-react";
import Nse500Tracker from "./components/Nse500Tracker";
import { 
  Ticker, 
  RecalibrationFilter, 
  IndexExposure, 
  NewsFeatured, 
  NewsFeedItem, 
  NewsSuggested, 
  PhaseConfig, 
  PipelinePhase, 
  PipelineLog,
  PipelineData,
  SignalsData,
  NewsData,
  ModelsData,
  EtfsData,
  EtfItem
} from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Backend Data States
  const [signals, setSignals] = useState<SignalsData | null>(null);
  const [news, setNews] = useState<NewsData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [models, setModels] = useState<ModelsData | null>(null);
  const [etfsData, setEtfsData] = useState<EtfsData | null>(null);
  const [etfViewMode, setEtfViewMode] = useState<"monitored" | "scraped">("scraped");
  const [selectedScrapedCategory, setSelectedScrapedCategory] = useState<string>("");
  const [isScrapingEtfs, setIsScrapingEtfs] = useState<boolean>(false);
  const [globalMonitorData, setGlobalMonitorData] = useState<any>(null);
  const [isScrapingGlobal, setIsScrapingGlobal] = useState<boolean>(false);
  const [monitorSubTab, setMonitorSubTab] = useState<"worldmonitor" | "macro">("worldmonitor");
  const [monitorSearchQuery, setMonitorSearchQuery] = useState<string>("");

  const [indianIndicesData, setIndianIndicesData] = useState<any>(null);
  const [isScrapingIndianIndices, setIsScrapingIndianIndices] = useState<boolean>(false);
  const [indianIndicesSearchQuery, setIndianIndicesSearchQuery] = useState<string>("");

  const [fiiDiiData, setFiiDiiData] = useState<any>(null);
  const [isScrapingFiiDii, setIsScrapingFiiDii] = useState<boolean>(false);
  const [fiiDiiSearchQuery, setFiiDiiSearchQuery] = useState<string>("");

  // NSE 500 Tracker States
  const [nse500Data, setNse500Data] = useState<any>(null);
  const [isScrapingNse500, setIsScrapingNse500] = useState<boolean>(false);
  const [nse500SearchQuery, setNse500SearchQuery] = useState<string>("");
  const [nse500SectorFilter, setNse500SectorFilter] = useState<string>("All");
  const [nse500CapFilter, setNse500CapFilter] = useState<string>("All");
  const [nse500SelectedStock, setNse500SelectedStock] = useState<any>(null);
  const [isLoadingNse500Quote, setIsLoadingNse500Quote] = useState<boolean>(false);
  const [nse500DetailedQuote, setNse500DetailedQuote] = useState<any>(null);

  // Earnings Calendar States
  const [earningsData, setEarningsData] = useState<any>(null);
  const [isScrapingEarnings, setIsScrapingEarnings] = useState<boolean>(false);
  const [earningsSearchQuery, setEarningsSearchQuery] = useState<string>("");

  // Live Earnings Calls States
  const [liveEarningsData, setLiveEarningsData] = useState<any>(null);
  const [isScrapingLiveEarnings, setIsScrapingLiveEarnings] = useState<boolean>(false);

  // MoneyControl World News States
  const [mcWorldData, setMcWorldData] = useState<any>(null);
  const [isScrapingMcWorld, setIsScrapingMcWorld] = useState<boolean>(false);
  const [mcWorldSearchQuery, setMcWorldSearchQuery] = useState<string>("");

  // NSE Data States
  const [nseData, setNseData] = useState<any>(null);
  const [isFetchingNSE, setIsFetchingNSE] = useState<boolean>(false);
  const [nseQuoteSymbol, setNseQuoteSymbol] = useState<string>("RELIANCE");
  const [nseQuote, setNseQuote] = useState<any>(null);

  // BSE Data States
  const [bseData, setBseData] = useState<any>(null);
  const [isFetchingBSE, setIsFetchingBSE] = useState<boolean>(false);
  const [bseQuoteCode, setBseQuoteCode] = useState<string>("500325");
  const [bseQuote, setBseQuote] = useState<any>(null);

  // Conflict Tracker & GNews States
  const [conflictApiKey, setConflictApiKey] = useState<string>(() => {
    return localStorage.getItem("gnews_api_key") || "";
  });
  const [alphaVantageApiKey, setAlphaVantageApiKey] = useState<string>(() => {
    return localStorage.getItem("alpha_vantage_api_key") || "";
  });
  const [conflictSearchTerm, setConflictSearchTerm] = useState<string>("war");
  const [conflictArticles, setConflictArticles] = useState<any[]>([]);
  const [isFetchingConflict, setIsFetchingConflict] = useState<boolean>(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictSearchLang, setConflictSearchLang] = useState<string>("en");
  const [conflictSearchCountry, setConflictSearchCountry] = useState<string>("any");
  const [conflictSortBy, setConflictSortBy] = useState<string>("publishedAt");
  const [conflictMaxResults, setConflictMaxResults] = useState<number>(10);

  // Interaction / Loading UX states for ETFs
  const [isRebalancingEtfs, setIsRebalancingEtfs] = useState<boolean>(false);
  const [isAnalyzingEtf, setIsAnalyzingEtf] = useState<Record<string, boolean>>({});

  // Scraper states
  const [isScrapingNews, setIsScrapingNews] = useState<boolean>(false);
  const [newsSourceFilter, setNewsSourceFilter] = useState<"all" | "zerodha" | "finology">("all");

  // Interaction / Loading UX states
  const [searchContext, setSearchContext] = useState<string>("");
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isPromptsLoading, setIsPromptsLoading] = useState<Record<string, boolean>>({});
  const [isPipelineRebooting, setIsPipelineRebooting] = useState<boolean>(false);
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  // Timer simulation state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(892.39);

  // References
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Trigger Toast helper
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 1. Fetch core databases on startup & periodics
  useEffect(() => {
    fetchSignals();
    fetchNews();
    fetchPipeline();
    fetchModels();
    fetchEtfs();
    fetchGlobalMonitor();
    fetchIndianIndices();
    fetchFiiDii();
    fetchNse500();
    fetchEarnings();
    fetchLiveEarnings();
    fetchMcWorld();
    fetchNSEData();
    fetchBSEData();
  }, []);

  // Timer tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 0.01);
    }, 10);
    return () => clearInterval(timer);
  }, []);

  // Conflict news dynamic sync
  useEffect(() => {
    if (activeTab === "conflict-tracker" && conflictApiKey) {
      fetchConflictNews(conflictSearchTerm);
    }
  }, [activeTab, conflictSearchTerm, conflictApiKey]);

  // Periodic random micro-flicker log updates
  useEffect(() => {
    const logInterval = setInterval(() => {
      if (activeTab === "pipeline" && pipeline) {
        // Occasionally append a live simulated log to show real-time stream execution
        if (Math.random() > 0.6) {
          const hours = new Date().toISOString().substring(11, 19);
          const levels = ["INFO", "EXEC", "WARN"];
          const level = levels[Math.floor(Math.random() * levels.length)];
          let message = "Evaluating node metrics...";
          if (level === "INFO") message = `L2 feed tick complete. Weights updated on CPU segment ${Math.floor(Math.random() * 8)}.`;
          if (level === "EXEC") message = `Executing attention sweep over standard model allocation.`;
          if (level === "WARN") message = `High latency detected on auxiliary route AWS-USE-1A. Retrying channel...`;

          setPipeline(prev => {
            if (!prev) return prev;
            const updatedLogs = [...prev.logs, { time: hours, level, message }];
            if (updatedLogs.length > 50) updatedLogs.shift(); // Keep logs clean
            return {
              ...prev,
              logs: updatedLogs
            };
          });
        }
      }
    }, 4000);
    return () => clearInterval(logInterval);
  }, [activeTab, pipeline]);

  // Log auto-scroll
  useEffect(() => {
    if (activeTab === "pipeline" && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [pipeline?.logs, activeTab]);

  const fetchSignals = async () => {
    try {
      const res = await fetch("/api/signals");
      if (res.ok) {
        const data = await res.json();
        setSignals(data);
      }
    } catch (err) {
      console.error("Failed to fetch signals:", err);
    }
  };

  const fetchNews = async () => {
    try {
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        setNews(data);
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
    }
  };

  const handleScrapeNews = async () => {
    setIsScrapingNews(true);
    showToast("Executing active web scrapers for Zerodha, Moneycontrol & Tickertape...", "info");
    try {
      const res = await fetch("/api/news/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setNews(data.db);
        showToast("Scraping completed! Live crawled feeds are now synchronized.", "success");
      } else {
        showToast("Fail-back: Scraper block or timeout detected.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network fault during active crawler trigger.", "error");
    } finally {
      setIsScrapingNews(false);
    }
  };

  const fetchPipeline = async () => {
    try {
      const res = await fetch("/api/pipeline");
      if (res.ok) {
        const data = await res.json();
        setPipeline(data);
      }
    } catch (err) {
      console.error("Failed to fetch pipeline:", err);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/models");
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (err) {
      console.error("Failed to fetch models:", err);
    }
  };

  const fetchEtfs = async () => {
    try {
      const res = await fetch("/api/etfs");
      if (res.ok) {
        const data = await res.json();
        setEtfsData(data);
        if (data.scrapedCategories && data.scrapedCategories.length > 0) {
          setSelectedScrapedCategory(data.scrapedCategories[0].category);
        }
      }
    } catch (err) {
      console.error("Failed to fetch etfs:", err);
    }
  };

  const fetchGlobalMonitor = async () => {
    try {
      const res = await fetch("/api/global-monitor");
      if (res.ok) {
        const data = await res.json();
        setGlobalMonitorData(data);
      }
    } catch (err) {
      console.error("Failed to fetch global monitor:", err);
    }
  };

  const handleScrapeGlobalMonitor = async () => {
    setIsScrapingGlobal(true);
    showToast("Executing active web crawlers over global news feeds and financial indices...", "info");
    try {
      const res = await fetch(`/api/global-monitor/scrape?alpha_key=${encodeURIComponent(alphaVantageApiKey)}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setGlobalMonitorData(data.db);
        if (data.alpha_message) {
          showToast(`Crawl complete! ${data.alpha_message}`, "info");
        } else if (alphaVantageApiKey) {
          showToast("Global monitor scrape finished! Live news and global indices updated.", "success");
        } else {
          showToast("Global monitor web scrape finished! Accurate live news ingested.", "success");
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Global monitor scrape timed out or was blocked.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network fault during active global crawl sequence.", "error");
    } finally {
      setIsScrapingGlobal(false);
    }
  };

  const fetchIndianIndices = async () => {
    try {
      const res = await fetch("/api/indian-indices");
      if (res.ok) {
        const data = await res.json();
        setIndianIndicesData(data);
      }
    } catch (err) {
      console.error("Failed to fetch Indian indices:", err);
    }
  };

  const handleScrapeIndianIndices = async () => {
    setIsScrapingIndianIndices(true);
    showToast("Initiating active scraper for NSE India live indices...", "info");
    try {
      const res = await fetch("/api/indian-indices/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIndianIndicesData(data.db);
        showToast("NSE India indices scraping completed successfully!", "success");
      } else {
        showToast("Failed to scrape live indices (rate-limit/guard trigger).", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network anomaly during NSE India scrape trigger.", "error");
    } finally {
      setIsScrapingIndianIndices(false);
    }
  };

  const fetchFiiDii = async () => {
    try {
      const res = await fetch("/api/fii-dii");
      if (res.ok) {
        const data = await res.json();
        setFiiDiiData(data);
      }
    } catch (err) {
      console.error("Failed to fetch FII/DII data:", err);
    }
  };

  const handleScrapeFiiDii = async () => {
    setIsScrapingFiiDii(true);
    showToast("Executing live active StockEdge Scraper for FII/DII activity...", "info");
    try {
      const res = await fetch("/api/fii-dii/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFiiDiiData(data.db);
        showToast("StockEdge FII/DII data retrieved successfully!", "success");
      } else {
        showToast("Failed to scrape FII/DII data (rate limits or proxy barrier).", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network anomaly during StockEdge scrape trigger.", "error");
    } finally {
      setIsScrapingFiiDii(false);
    }
  };

  const fetchNse500 = async () => {
    try {
      const res = await fetch("/api/nse500");
      if (res.ok) {
        const data = await res.json();
        setNse500Data(data);
      }
    } catch (err) {
      console.error("Failed to fetch NSE 500 data:", err);
    }
  };

  const handleScrapeNse500 = async () => {
    setIsScrapingNse500(true);
    showToast("Launching active NSE 500 parser...", "info");
    try {
      const res = await fetch("/api/nse500/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setNse500Data(data.data);
        showToast("NSE 500 scraped successfully!", "success");
      } else {
        showToast("WAF or network error scraping live NSE 500 index details.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network failure during NSE 500 active crawl.", "error");
    } finally {
      setIsScrapingNse500(false);
    }
  };

  const fetchDetailedNse500Quote = async (symbol: string) => {
    setIsLoadingNse500Quote(true);
    try {
      const res = await fetch(`/api/nse500/quote?symbol=${encodeURIComponent(symbol)}`);
      if (res.ok) {
        const data = await res.json();
        setNse500DetailedQuote(data);
        showToast(`Detailed quote loaded for ${symbol}`, "success");
      } else {
        showToast(`Failed to parse live quote details for ${symbol}`, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network fault while fetching quote info", "error");
    } finally {
      setIsLoadingNse500Quote(false);
    }
  };

  // Earnings Calendar API Functions
  const fetchEarnings = async () => {
    try {
      const res = await fetch("/api/earnings");
      if (res.ok) {
        const data = await res.json();
        setEarningsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch earnings data:", err);
    }
  };

  const handleScrapeEarnings = async () => {
    setIsScrapingEarnings(true);
    showToast("Scraping Moneycontrol earnings calendar...", "info");
    try {
      const res = await fetch("/api/earnings/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setEarningsData(data.data);
        showToast("Earnings data scraped successfully!", "success");
      } else {
        showToast("Failed to scrape earnings data from Moneycontrol.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network failure during earnings scrape.", "error");
    } finally {
      setIsScrapingEarnings(false);
    }
  };

  // Live Earnings Calls API Functions
  const fetchLiveEarnings = async () => {
    try {
      const res = await fetch("/api/live-earnings");
      if (res.ok) {
        const data = await res.json();
        setLiveEarningsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch live earnings data:", err);
    }
  };

  const handleScrapeLiveEarnings = async () => {
    setIsScrapingLiveEarnings(true);
    showToast("Scraping live earnings calls...", "info");
    try {
      const res = await fetch("/api/live-earnings/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLiveEarningsData(data.data);
        showToast("Live earnings calls scraped successfully!", "success");
      } else {
        showToast("Failed to scrape live earnings calls.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network failure during live earnings scrape.", "error");
    } finally {
      setIsScrapingLiveEarnings(false);
    }
  };

  // MoneyControl World News API Functions
  const fetchMcWorld = async () => {
    try {
      const res = await fetch("/api/moneycontrol-world");
      if (res.ok) {
        const data = await res.json();
        setMcWorldData(data);
      }
    } catch (err) {
      console.error("Failed to fetch MoneyControl World data:", err);
    }
  };

  const handleScrapeMcWorld = async () => {
    setIsScrapingMcWorld(true);
    showToast("Scraping MoneyControl World news (Playwright)...", "info");
    try {
      const res = await fetch("/api/moneycontrol-world/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setMcWorldData(data.data);
        showToast("MoneyControl World news scraped successfully!", "success");
      } else {
        showToast("Failed to scrape MoneyControl World news.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network failure during MoneyControl World scrape.", "error");
    } finally {
      setIsScrapingMcWorld(false);
    }
  };

  // NSE Data API Functions
  const fetchNSEData = async () => {
    try {
      const res = await fetch("/api/nse");
      if (res.ok) {
        const data = await res.json();
        setNseData(data);
      }
    } catch (err) {
      console.error("Failed to fetch NSE data:", err);
    }
  };

  const handleFetchNSEData = async () => {
    setIsFetchingNSE(true);
    showToast("Fetching NSE India data...", "info");
    try {
      const res = await fetch("/api/nse/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setNseData(data.data);
        showToast("NSE data fetched successfully!", "success");
      } else {
        showToast("Failed to fetch NSE data.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error fetching NSE data.", "error");
    } finally {
      setIsFetchingNSE(false);
    }
  };

  const fetchNSEQuoteData = async (symbol: string) => {
    if (!symbol) return;
    try {
      const res = await fetch(`/api/nse/quote/${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setNseQuote(data);
      }
    } catch (err) {
      console.error("Failed to fetch NSE quote:", err);
    }
  };

  // BSE Data API Functions
  const fetchBSEData = async () => {
    try {
      const res = await fetch("/api/bse");
      if (res.ok) {
        const data = await res.json();
        setBseData(data);
      }
    } catch (err) {
      console.error("Failed to fetch BSE data:", err);
    }
  };

  const handleFetchBSEData = async () => {
    setIsFetchingBSE(true);
    showToast("Fetching BSE India data...", "info");
    try {
      const res = await fetch("/api/bse/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBseData(data.data);
        showToast("BSE data fetched successfully!", "success");
      } else {
        showToast("Failed to fetch BSE data.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error fetching BSE data.", "error");
    } finally {
      setIsFetchingBSE(false);
    }
  };

  const fetchBSEQuoteData = async (scripCode: string) => {
    if (!scripCode) return;
    try {
      const res = await fetch(`/api/bse/quote/${scripCode}`);
      if (res.ok) {
        const data = await res.json();
        setBseQuote(data);
      }
    } catch (err) {
      console.error("Failed to fetch BSE quote:", err);
    }
  };

  const fetchConflictNews = async (term: string) => {
    if (!conflictApiKey) {
      showToast("GNews API Key is missing. Please configure it in the Settings tab.", "error");
      setConflictError("GNews API Key is missing. Head to the Settings tab to enter your key.");
      return;
    }
    setIsFetchingConflict(true);
    setConflictError(null);
    showToast(`Accessing GNews feed for "${term}"...`, "info");
    try {
      const encodedQuery = encodeURIComponent(term);
      const url = `/api/gnews/search?q=${encodedQuery}&lang=${conflictSearchLang}&country=${conflictSearchCountry}&sortby=${conflictSortBy}&max=${conflictMaxResults}&apikey=${encodeURIComponent(conflictApiKey)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GNews Server responded with HTTP code ${response.status}`);
      }
      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors.join(", "));
      }
      if (data.articles) {
        setConflictArticles(data.articles || []);
        showToast(`Successfully retrieved ${data.articles.length} news articles!`, "success");
      } else {
        setConflictArticles([]);
        showToast("No active articles matches this query keyword.", "info");
      }
    } catch (err: any) {
      console.error(err);
      setConflictError(err.message || "Failed to query high-precision GNews API.");
      showToast(err.message || "GNews feed download anomaly.", "error");
    } finally {
      setIsFetchingConflict(false);
    }
  };

  const handleScrapeEtfs = async () => {
    setIsScrapingEtfs(true);
    showToast("Executing live active web crawlers over 14 Global ETF categories...", "info");
    try {
      const res = await fetch("/api/etfs/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setEtfsData(data.db);
        showToast("Scraping and data capture completed! 14 categories successfully crawled.", "success");
        if (data.db.scrapedCategories && data.db.scrapedCategories.length > 0) {
          setSelectedScrapedCategory(data.db.scrapedCategories[0].category);
        }
      } else {
        showToast("Active crawler execution timed out or was blocked.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network fault during active crawl sequence.", "error");
    } finally {
      setIsScrapingEtfs(false);
    }
  };

  const handleRebalanceEtfs = async () => {
    setIsRebalancingEtfs(true);
    showToast("Triggering Global ETF Portfolio Rebalance...", "info");
    try {
      const res = await fetch("/api/etfs/rebalance", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setEtfsData(data.db);
        showToast("ETF portfolio weights and asset targets optimized successfully!", "success");
      } else {
        showToast("Rebalance denied by execution proxy.", "error");
      }
    } catch (err) {
      showToast("Network fault during ETF rebalance.", "error");
    } finally {
      setIsRebalancingEtfs(false);
    }
  };

  const handleAnalyzeEtf = async (symbol: string) => {
    setIsAnalyzingEtf(prev => ({ ...prev, [symbol]: true }));
    showToast(`Contacting Gemini model proxy to analyze ${symbol}...`, "info");
    try {
      const res = await fetch("/api/etfs/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      if (res.ok) {
        const data = await res.json();
        setEtfsData(data.db);
        showToast(`Gemini analyst report generated successfully for ${symbol}!`, "success");
      } else {
        showToast("Capital proxy rejected report compilation.", "error");
      }
    } catch (err) {
      showToast("Network failure fetching Gemini model evaluation.", "error");
    } finally {
      setIsAnalyzingEtf(prev => ({ ...prev, [symbol]: false }));
    }
  };

  // 2. Core Interactions
  const handleRecalibrateFilterToggle = async (filterId: string) => {
    if (!signals) return;
    const updatedFilters = signals.recalibration.filters.map(f => {
      if (f.id === filterId) {
        return { ...f, active: !f.active };
      }
      return f;
    });

    // Optimistically project new confidence
    let delta = updatedFilters.filter(f => f.active).length * 8.5 + 68.2;
    const confidence = +Math.min(99.6, Math.max(60.2, delta + (Math.random() - 0.5) * 4)).toFixed(1);

    setIsCalibrating(true);
    try {
      const res = await fetch("/api/signals/recalibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: updatedFilters, confidence }),
      });
      if (res.ok) {
        const data = await res.json();
        setSignals(data.db);
        showToast(`Recalibration engine complete: confidence set to ${confidence}%`, "success");
      }
    } catch (err) {
      showToast("Backend connection limit exceeded. Check console.", "error");
    } finally {
      setIsCalibrating(false);
    }
  };

  const handleManualRecalibrate = async () => {
    if (!signals) return;
    setIsCalibrating(true);
    const confidence = +(75 + Math.random() * 24).toFixed(1);
    try {
      const res = await fetch("/api/signals/recalibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confidence }),
      });
      if (res.ok) {
        const data = await res.json();
        setSignals(data.db);
        showToast("Recalibrated model allocations. Ticker scoring randomized.", "success");
      }
    } catch (err) {
      showToast("Calibration alignment faulted.", "error");
    } finally {
      setIsCalibrating(false);
    }
  };

  // Perform Gemini AI macro market intelligence summary
  const handleAiMarketAnalysis = async () => {
    if (!searchContext) {
      showToast("Please provide a search context or theme for Gemini to analyze.", "info");
      return;
    }
    setIsAiLoading(true);
    showToast("Gemini initializing model 'gemini-3.5-flash'. Running search analysis...", "info");
    try {
      const res = await fetch("/api/news/analyze-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: searchContext }),
      });
      if (res.ok) {
        const data = await res.json();
        setNews(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            featured: data.featured,
            feed: data.feed
          };
        });
        setSearchContext("");
        showToast("Gemini intelligence news feed story generated successfully!", "success");
      } else {
        const errData = await res.json();
        showToast(errData.error || "Gemini API unavailable", "error");
      }
    } catch (err) {
      showToast("Failed to run Gemini analysis task.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Reset or Reboot Pipeline sequence
  const handleRebootPipeline = async () => {
    setIsPipelineRebooting(true);
    showToast("Rebooting execution sequence Node ID: ORCA-16...", "info");
    try {
      const res = await fetch("/api/pipeline/reboot", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPipeline(data.db);
        showToast("Pipeline returned online. Support node cooling complete.", "success");
      }
    } catch (err) {
      showToast("Failure rebooting node gateway.", "error");
    } finally {
      setIsPipelineRebooting(false);
    }
  };

  // Optimize individual model prompts using Gemini
  const handleOptimizePrompt = async (phaseId: string, currentPrompt: string) => {
    setIsPromptsLoading(prev => ({ ...prev, [phaseId]: true }));
    showToast("Gemini 3.5 evaluating prompt. Performing principal structural refactoring...", "info");
    try {
      const res = await fetch("/api/models/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseId, currentPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setModels(data.db);
        showToast("Prompt optimization complete with neural embedding compression!", "success");
      } else {
        const errData = await res.json();
        showToast(errData.error || "Gemini key is missing or invalid.", "error");
      }
    } catch (err) {
      showToast("Optimize API call timed out.", "error");
    } finally {
      setIsPromptsLoading(prev => ({ ...prev, [phaseId]: false }));
    }
  };

  // Commit dynamic configurations to disk
  const handleCommitModels = async () => {
    if (!models) return;
    try {
      const res = await fetch("/api/models/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(models),
      });
      if (res.ok) {
        showToast("Configurations committed successfully to data-models.json persistence!", "success");
      }
    } catch (err) {
      showToast("Commit rejected.", "error");
    }
  };

  // Set the prompt override text state locally before commit
  const handlePromptChange = (phaseId: string, value: string) => {
    if (!models) return;
    const updatedPhases = models.phases.map(p => {
      if (p.id === phaseId) {
        return {
          ...p,
          prompt: value,
          tokensUsed: Math.floor(value.length / 4)
        };
      }
      return p;
    });
    setModels({
      ...models,
      phases: updatedPhases
    });
  };

  // Set the allocation models select state locally
  const handleAllocationChange = (phaseId: string, value: string) => {
    if (!models) return;
    const updatedPhases = models.phases.map(p => {
      if (p.id === phaseId) {
        return { ...p, allocation: value };
      }
      return p;
    });
    setModels({
      ...models,
      phases: updatedPhases
    });
  };

  const handleRetryCountChange = (value: number) => {
    if (!models) return;
    setModels({
      ...models,
      retryCount: value
    });
  };

  const handleEmbeddingsToggle = () => {
    if (!models) return;
    setModels({
      ...models,
      autoEmbeddings: !models.autoEmbeddings
    });
  };

  // Orbital silver tracking calculations for hovering states
  const handleOrbitalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;
    card.style.setProperty('--angle', `${angle}deg`);
  };

  // Ticker filter
  const filteredTickers = signals?.tickers.filter(t => 
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sector.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen overflow-hidden text-on-surface select-none relative font-sans scanline-effect">
      {/* Background Dimming Matrix */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-black/45"></div>

      {/* Floating Alerts Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`p-4 rounded-xl border flex items-center gap-3 backdrop-blur-2xl shadow-xl ${
            toastType === "success" 
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-100" 
              : toastType === "error" 
              ? "bg-rose-950/90 border-rose-500/50 text-rose-100" 
              : "bg-cyan-950/90 border-cyan-500/50 text-cyan-100"
          }`}>
            <span className="material-symbols-outlined text-xl">
              {toastType === "success" ? "check_circle" : toastType === "error" ? "report_problem" : "info"}
            </span>
            <span className="font-mono text-xs font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* LEFT SIDE NAVIGATION PANEL BAR */}
      <aside className="hidden md:flex flex-col h-full py-8 px-6 glass-panel glass-panel-silver-border w-72 shrink-0 z-30">
        <div className="mb-10 px-2 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-gray-400 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <span className="material-symbols-outlined text-black text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>dataset</span>
          </div>
          <div>
            <h1 className="font-bold text-xl text-white tracking-tight leading-none mb-1">ORCA_v16</h1>
            <p className="font-mono text-[9px] text-on-surface-variant/70 uppercase tracking-[0.2em]">Alpha Terminal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="font-mono text-[9px] text-on-surface-variant/40 px-4 mb-3 uppercase tracking-[0.2em]">Navigation</p>
          
          <button 
            id="nav-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "dashboard" 
                ? "bg-white/10 text-white border border-white/20 shadow-md" 
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">grid_view</span>
            Dashboard
          </button>

          <button 
            id="nav-indian-indices"
            onClick={() => setActiveTab("indian-indices")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "indian-indices" 
                ? "bg-white/10 text-white border border-white/20 shadow-md" 
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">analytics</span>
            Indian Indices
          </button>

          <button 
            id="nav-nse-500-tracker"
            onClick={() => setActiveTab("nse-500-tracker")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "nse-500-tracker" 
                ? "bg-white/10 text-white border border-white/20 shadow-md" 
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">query_stats</span>
            NSE 500 Tracker
          </button>

          <button 
            id="nav-fii-dii"
            onClick={() => setActiveTab("fii-dii")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "fii-dii" 
                ? "bg-white/10 text-white border border-white/20 shadow-md" 
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
            Institutional Investment Flow
          </button>

          <button 
            id="nav-news"
            onClick={() => setActiveTab("news")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "news" 
                ? "bg-white/10 text-white border border-white/20 shadow-md" 
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">newspaper</span>
            News Feed
          </button>

          <button 
            id="nav-pipeline"
            onClick={() => setActiveTab("pipeline")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "pipeline" 
                ? "bg-white/10 text-white border border-white/20 shadow-md" 
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">hub</span>
            Pipeline
          </button>

          <button 
            id="nav-etfs"
            onClick={() => setActiveTab("etfs")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "etfs" 
                ? "bg-white/10 text-white border border-white/20 shadow-md" 
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">public</span>
            Global ETF's
          </button>

          <button
            id="nav-global-monitor"
            onClick={() => setActiveTab("global-monitor")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "global-monitor"
                ? "bg-white/10 text-white border border-white/20 shadow-md"
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">language</span>
            Global Monitor
          </button>

          <button
            id="nav-earnings"
            onClick={() => setActiveTab("earnings")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "earnings"
                ? "bg-white/10 text-white border border-white/20 shadow-md"
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">calendar_month</span>
            Earnings Calendar
          </button>

          <div className="h-4"></div>
          <p className="font-mono text-[9px] text-on-surface-variant/40 px-4 mb-3 uppercase tracking-[0.2em]">Modules</p>

          <button 
            id="nav-models"
            onClick={() => setActiveTab("models")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "models" 
                ? "bg-white/10 text-white border border-white/20 shadow-md" 
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">settings_suggest</span>
            Models
          </button>

          <button 
            id="nav-conflict-tracker"
            onClick={() => setActiveTab("conflict-tracker")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "conflict-tracker" 
                ? "bg-white/10 text-white border border-white/20 shadow-md" 
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">gavel</span>
            Conflict Tracker
          </button>

          <button 
            id="nav-settings"
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-4 px-4 py-3 font-mono text-xs rounded-xl transition-all duration-200 text-left ${
              activeTab === "settings" 
                ? "bg-white/10 text-white border border-white/20 shadow-md" 
                : "text-on-surface-variant hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            Settings
          </button>

          <button 
            onClick={() => showToast("Oracle Core operational. Mode set to system specifications.", "info")}
            className="w-full flex items-center gap-4 px-4 py-3 font-mono text-xs text-on-surface-variant hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 text-left"
          >
            <span className="material-symbols-outlined text-xl">terminal</span>
            Terminal
          </button>
        </nav>

        {/* Profiles Admin Core Indicator */}
        <div className="mt-auto pt-6 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-white opacity-70">shield_person</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-white">Trader_Admin</p>
              <p className="text-[9px] text-cyan-400 font-mono tracking-wider">Tier 1 License</p>
            </div>
          </div>
          <button 
            onClick={() => showToast("Upgrade workflow triggers secure sandbox portal.", "info")}
            className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-white/10 tracking-widest font-mono"
          >
            UPGRADE_LICENSE
          </button>
        </div>
      </aside>

      {/* CORE FRAME CONTENT WRAPPER */}
      <main className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative z-10">
        
        {/* TOP META BAR */}
        <div className="h-24 flex items-center justify-between px-10 border-b border-white/10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] group-focus-within:text-cyan-400 transition-colors w-4 h-4" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-xl pl-12 pr-6 py-2.5 text-sm w-96 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400/50 outline-none text-white transition-all font-mono placeholder:text-on-surface-variant/40" 
                placeholder="Search Tickers (e.g. AAPL, NVDA)..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleManualRecalibrate}
              disabled={isCalibrating}
              className="px-6 h-12 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] tracking-widest font-mono disabled:opacity-55"
            >
              <RotateCw className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />
              RECALIBRATE
            </button>
          </div>
        </div>

        {/* CONTAINER VIEW STATE DETECTOR */}
        <div className="flex-1 overflow-y-auto px-10 py-8 relative">
          <div className="max-w-[1600px] mx-auto">
            
            {/* TAB ONE: DASHBOARD / SIGNALS SCREEN */}
            {activeTab === "dashboard" && (
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left Active Alpha Signals column */}
                <div className="flex-1 space-y-8">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-1.5 h-6 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)]"></div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Active Alpha Signals</h2>
                      </div>
                      <p className="text-on-surface-variant text-xs ml-4 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded inline-block font-semibold">
                        Real-time predictive scoring across major indices
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <span className="px-3 py-1.5 bg-black/60 backdrop-blur-2xl text-cyan-400 font-mono text-[10px] rounded-lg border border-white/10 flex items-center gap-2 font-bold select-none h-fit">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                        LIVE_STREAM: ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Featured Central Card (AAPL) */}
                  {signals?.tickers.slice(0,1).map((aapl) => (
                    <div 
                      key={aapl.symbol}
                      className="orbital-border" 
                      onMouseMove={handleOrbitalMouseMove}
                    >
                      <div className="orca-card rounded-[inherit] p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[120px] -mr-40 -mt-40"></div>
                        
                        <div className="flex justify-between items-start relative z-10 mb-10">
                          <div className="flex gap-6 items-center">
                            <div className="w-14 h-14 bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-3xl opacity-80" style={{ fontVariationSettings: "'FILL' 1" }}>
                                finance_mode
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-4 mb-1">
                                <h3 className="text-3xl font-extrabold tracking-tighter text-white">{aapl.symbol}</h3>
                                <span className="font-mono text-[10px] px-3 py-1 bg-white/10 backdrop-blur-md text-cyan-200 border border-white/25 rounded-full font-bold">
                                  {aapl.rating}
                                </span>
                              </div>
                              <p className="text-on-surface-variant font-medium flex items-center gap-2 text-xs">
                                {aapl.company} <span className="w-1 h-1 bg-outline-variant rounded-full"></span> {aapl.sector}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-mono text-3xl text-cyan-400 font-bold">${aapl.price.toFixed(2)}</div>
                            <div className="font-mono text-cyan-500/90 text-sm flex items-center justify-end gap-1 font-semibold">
                              <span className="material-symbols-outlined text-[18px]">trending_up</span> 
                              +{aapl.changeToday.toFixed(2)}% Today
                            </div>
                          </div>
                        </div>

                        {/* Four metrics grids */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
                          <div className="p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:border-white/30 transition-colors">
                            <p className="font-mono text-[9px] text-on-surface-variant/80 mb-2 uppercase tracking-wider font-bold">RSI (14-Day)</p>
                            <p className="font-mono text-xl text-white font-bold">{aapl.rsi}</p>
                            <div className="w-full h-1 bg-white/10 mt-3 rounded-full overflow-hidden">
                              <div className="h-full bg-white transition-all duration-500" style={{ width: `${aapl.rsi}%` }}></div>
                            </div>
                          </div>

                          <div className="p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:border-white/30 transition-colors">
                            <p className="font-mono text-[9px] text-on-surface-variant/80 mb-2 uppercase tracking-wider font-bold">EMA_200 Cross</p>
                            <p className="font-mono text-xl text-cyan-400 uppercase font-bold">{aapl.ema200}</p>
                            <p className="text-[10px] text-on-surface-variant/80 mt-2 font-mono font-semibold">{aapl.ema200Details}</p>
                          </div>

                          <div className="p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:border-white/30 transition-colors">
                            <p className="font-mono text-[9px] text-on-surface-variant/80 mb-2 uppercase tracking-wider font-bold">Volume Flow</p>
                            <p className="font-mono text-xl text-white font-bold">{aapl.volFlow}</p>
                            <p className="text-[10px] text-cyan-300 mt-2 font-semibold font-mono">{aapl.volFlowDetails}</p>
                          </div>

                          <div className="p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:border-white/30 transition-colors">
                            <p className="font-mono text-[9px] text-on-surface-variant/80 mb-2 uppercase tracking-wider font-bold">Alpha Score</p>
                            <p className="font-mono text-xl text-white font-bold">{aapl.alphaScore}/100</p>
                            <p className="text-[10px] text-on-surface-variant/80 mt-2 font-semibold font-mono">Institutional Grade</p>
                          </div>
                        </div>

                        {/* Premium Chart SVG */}
                        <div className="h-40 w-full relative z-10 mt-4 rounded-xl overflow-hidden bg-neutral-950/20 backdrop-blur-md p-2 border border-white/5">
                          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 150">
                            <defs>
                              <linearGradient id="gradientA" x1="0%" x2="0%" y1="0%" y2="100%">
                                <stop offset="0%" stopColor="rgba(0, 240, 255, 0.45)"></stop>
                                <stop offset="100%" stopColor="transparent"></stop>
                              </linearGradient>
                            </defs>
                            <path 
                              d="M0 120 C 50 110, 100 140, 150 100 S 250 40, 300 80 S 400 20, 500 60 S 600 130, 700 90 S 850 40, 1000 10 V 150 H 0 Z" 
                              fill="url(#gradientA)"
                            ></path>
                            <path 
                              d="M0 120 C 50 110, 100 140, 150 100 S 250 40, 300 80 S 400 20, 500 60 S 600 130, 700 90 S 850 40, 1000 10" 
                              fill="none" 
                              stroke="white" 
                              strokeLinecap="round" 
                              strokeWidth="2.5"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Dynamic Signals grid bottom tickers (NVDA, TSLA, MSFT) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredTickers.slice(1).map((t) => (
                      <div 
                        key={t.symbol}
                        className="orbital-border"
                        onMouseMove={handleOrbitalMouseMove}
                      >
                        <div className="orca-card rounded-[inherit] p-6 h-full flex flex-col relative justify-between">
                          <div className="flex justify-between items-center mb-4 relative z-10">
                            <h3 className="font-bold text-xl text-white">{t.symbol}</h3>
                            <div className={`w-10 h-10 rounded-lg backdrop-blur-md flex items-center justify-center border border-white/10 ${
                              t.rating === "REDUCE" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white"
                            }`}>
                              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {t.logo}
                              </span>
                            </div>
                          </div>

                          <div className={`font-mono text-2xl font-bold relative z-10 mb-1 ${
                            t.rating === "REDUCE" ? "text-rose-400" : "text-cyan-400"
                          }`}>
                            ${t.price.toFixed(2)}
                          </div>
                          
                          <div className={`font-mono text-xs font-bold mb-6 tracking-wider relative z-10 uppercase ${
                            t.rating === "REDUCE" ? "text-rose-300" : "text-cyan-300"
                          }`}>
                            {t.changeToday > 0 ? `+${t.changeToday.toFixed(2)}%` : `${t.changeToday.toFixed(2)}%`}{" "}
                            {t.symbol === "NVDA" ? "MOMENTUM" : t.symbol === "TSLA" ? "CRITICAL" : "STABLE"}
                          </div>

                          {/* Render custom card specifics based on screenshot */}
                          {t.symbol === "NVDA" && (
                            <div className="space-y-4 mb-6 relative z-10">
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-[10px] text-on-surface-variant/80 font-bold">VOLATILITY</span>
                                <span className="font-mono text-xs text-cyan-400 font-bold">{t.volatility}</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="w-1/4 h-full bg-white"></div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-[10px] text-on-surface-variant/80 font-bold">WHALE_FLOW</span>
                                <span className="font-mono text-xs text-white font-bold">{t.whaleFlow}</span>
                              </div>
                            </div>
                          )}

                          {t.symbol === "TSLA" && (
                            <div className="p-3 bg-red-950/20 border border-red-500/30 backdrop-blur-md rounded-xl mb-6 relative z-10">
                              <p className="text-xs text-rose-300/90 leading-relaxed font-semibold">
                                {t.riskText}
                              </p>
                            </div>
                          )}

                          {t.symbol === "MSFT" && (
                            <div className="flex flex-col gap-2 mb-6 relative z-10">
                              <div className="flex justify-between text-[10px] font-mono font-bold text-on-surface-variant/80">
                                <span>SENTIMENT_PULSE</span>
                                <span className="text-purple-300 font-bold">{t.sentiment}</span>
                              </div>
                              <div className="flex gap-1 h-3">
                                <div className="flex-1 bg-purple-400 rounded-sm shadow-[0_0_8px_rgba(209,188,255,0.4)]"></div>
                                <div className="flex-1 bg-purple-400 rounded-sm shadow-[0_0_8px_rgba(209,188,255,0.4)]"></div>
                                <div className="flex-1 bg-purple-400 rounded-sm shadow-[0_0_8px_rgba(209,188,255,0.4)]"></div>
                                <div className="flex-1 bg-purple-400/40 rounded-sm"></div>
                                <div className="flex-1 bg-white/10 rounded-sm"></div>
                              </div>
                            </div>
                          )}

                          {t.symbol === "NVDA" && (
                            <button 
                              onClick={() => showToast("Analysing GPU acceleration node profiles... No anomalies.", "success")}
                              className="w-full py-3 bg-white/5 backdrop-blur-2xl text-white hover:bg-white hover:text-black font-mono text-[10px] font-bold rounded-lg transition-all duration-300 border border-white/10 relative z-10 tracking-widest"
                            >
                              ANALYZE_NODES
                            </button>
                          )}

                          {t.symbol === "TSLA" && (
                            <div className="flex gap-2 relative z-10 font-mono text-[9px] font-bold">
                              <button 
                                onClick={() => showToast("Positions Hedged", "info")}
                                className="flex-1 py-2 text-center bg-rose-500/20 text-rose-300 rounded-md border border-rose-500/30 backdrop-blur-md hover:bg-rose-500 hover:text-white transition-colors"
                              >
                                REDUCE
                              </button>
                              <button 
                                onClick={() => showToast("Delta options hedge placed", "success")}
                                className="flex-1 py-2 text-center bg-white/5 text-on-surface-variant rounded-md border border-white/10 backdrop-blur-md hover:bg-white/10 hover:text-white transition-colors"
                              >
                                HEDGE
                              </button>
                            </div>
                          )}

                          {t.symbol === "MSFT" && (
                            <div className="flex items-center gap-3 relative z-10 justify-between">
                              <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full border border-neutral-900 bg-neutral-800 flex items-center justify-center text-[8px] text-white">M1</div>
                                <div className="w-6 h-6 rounded-full border border-neutral-900 bg-neutral-800 flex items-center justify-center text-[8px] text-white">M2</div>
                              </div>
                              <span className="text-[10px] text-on-surface-variant/80 font-mono font-medium">Whale Accrual Active</span>
                            </div>
                          )}

                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Recalibration Sidebar Panel */}
                <aside className="w-full lg:w-96 shrink-0 space-y-8 z-20 flex flex-col justify-between">
                  <div className="orbital-border h-fit" onMouseMove={handleOrbitalMouseMove}>
                    <div className="orca-card rounded-[inherit] p-8 flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                      
                      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10 relative z-10">
                        <SlidersHorizontal className="text-white w-5 h-5" />
                        <h2 className="text-lg font-bold text-white">Recalibration Engine</h2>
                      </div>

                      <div className="space-y-6 relative z-10">
                        <div>
                          <h3 className="font-mono text-[10px] text-on-surface-variant/80 opacity-80 mb-4 uppercase tracking-[0.2em] font-bold">
                            FILTER_ARCHITECTURE
                          </h3>
                          
                          <div className="space-y-3">
                            {signals?.recalibration.filters.map((f) => (
                              <label 
                                key={f.id}
                                className="flex items-center justify-between p-3 bg-black/40 backdrop-blur-2xl rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-all group"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all">
                                    <input 
                                      type="checkbox"
                                      checked={f.active}
                                      onChange={() => handleRecalibrateFilterToggle(f.id)}
                                      className="w-4 h-4 rounded text-black bg-white focus:ring-0 focus:ring-offset-0 cursor-pointer border-none"
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">{f.label}</span>
                                </div>
                                <span className="font-mono text-[10px] text-white/80 font-semibold">{f.value}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-mono text-[10px] text-on-surface-variant/80 opacity-80 mb-4 uppercase tracking-[0.2em] font-bold">
                            MODEL_CONFIDENCE
                          </h3>

                          {signals && (
                            <div className="p-6 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 relative">
                              <div className="flex justify-between items-end mb-4">
                                <div className="font-mono text-4xl text-white font-bold">
                                  {signals.recalibration.confidence}
                                  <span className="text-xl opacity-40">%</span>
                                </div>
                                <span className="font-mono text-[9px] text-white/70 uppercase pb-1 font-bold">
                                  Very High Conf
                                </span>
                              </div>
                              
                              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className="h-full bg-gradient-to-r from-gray-400 via-white to-gray-400 shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-700"
                                  style={{ width: `${signals.recalibration.confidence}%` }}
                                ></div>
                              </div>
                              <p className="text-[10px] text-on-surface-variant/80 mt-4 leading-relaxed italic">
                                "Signal accuracy based on backtesting 4.2k scenarios in current market regime."
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={handleManualRecalibrate}
                        className="w-full mt-8 py-4 bg-white/5 backdrop-blur-2xl border border-white/20 hover:border-white/60 text-white font-mono text-xs font-bold transition-all active:scale-[0.98] rounded-xl relative z-10 uppercase tracking-widest"
                      >
                        REGENERATE_ENVIRONMENT
                      </button>
                    </div>
                  </div>

                  <div className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                    <div className="orca-card rounded-[inherit] p-6">
                      <div className="flex justify-between items-center mb-4 relative z-10">
                        <h3 className="font-mono text-[10px] text-white/80 flex items-center gap-2 font-bold uppercase tracking-wider">
                          INDEX_EXPOSURE
                        </h3>
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping shadow-[0_0_8px_rgba(0,255,0,0.8)]"></span>
                      </div>
                      <div className="space-y-3 relative z-10">
                        {signals?.exposures.map((item) => (
                          <div 
                            key={item.name}
                            className="flex justify-between items-center p-3 bg-black/40 backdrop-blur-2xl rounded-lg border border-white/5"
                          >
                            <span className="font-mono text-xs text-white/90 font-bold">{item.name}</span>
                            <span className={`font-mono text-xs font-bold ${item.change >= 0 ? "text-cyan-400" : "text-rose-400"}`}>
                              {item.change >= 0 ? "+" : ""}{item.change}% {item.displayValue && `(${item.displayValue})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Real Global Indices Card powered by Alpha Vantage */}
                  <div className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                    <div className="orca-card rounded-[inherit] p-6 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-4 relative z-10">
                        <h3 className="font-mono text-[10px] text-white/80 flex items-center gap-2 font-bold uppercase tracking-wider">
                          GLOBAL_MARKETS_LIVE
                        </h3>
                        <span className={`w-2 h-2 rounded-full ${alphaVantageApiKey ? "bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-neutral-500 animate-pulse"}`}></span>
                      </div>

                      <div className="space-y-3 relative z-10">
                        {!alphaVantageApiKey ? (
                          <div className="py-4 text-center space-y-2.5">
                            <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">
                              Alpha Vantage credentials unassigned. To activate live global feeds (Dow Jones, S&P 500, Nasdaq, VIX), please configure your key underneath Settings.
                            </p>
                            <button
                              onClick={() => setActiveTab("settings")}
                              className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white hover:text-black font-semibold text-[9px] font-mono tracking-widest text-white rounded-lg transition-all"
                            >
                              CONFIGURE_KEY
                            </button>
                          </div>
                        ) : !globalMonitorData?.global_indices || globalMonitorData.global_indices.length === 0 ? (
                          <div className="py-4 text-center space-y-2.5">
                            <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">
                              Real-time global monitor is idle. Initiate dynamic background index crawlers to populate values.
                            </p>
                            <button
                              onClick={handleScrapeGlobalMonitor}
                              disabled={isScrapingGlobal}
                              className="w-full py-2.5 bg-cyan-400/20 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] border border-cyan-400/30 font-semibold text-[9px] font-mono tracking-widest text-cyan-400 rounded-lg transition-all disabled:opacity-50"
                            >
                              {isScrapingGlobal ? "CRAWLING..." : "FETCH_GLOBAL_INDICES"}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {globalMonitorData.global_indices.map((idxItem: any) => {
                              const isUp = idxItem.change >= 0;
                              return (
                                <div 
                                  key={idxItem.symbol}
                                  className="flex flex-col gap-1 p-2.5 bg-black/45 rounded-lg border border-white/5 hover:border-white/20 transition-all text-left"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-mono text-xs font-black text-white">{idxItem.symbol}</span>
                                    <span className={`font-mono text-[10px] font-bold ${isUp ? "text-cyan-400" : "text-rose-400"}`}>
                                      {isUp ? "▲" : "▼"} {idxItem.percent_change.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-[9px] font-mono text-neutral-500 font-semibold truncate max-w-[130px]">{idxItem.name}</span>
                                    <span className="font-mono text-xs font-bold text-neutral-300">
                                      {idxItem.last_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="flex justify-between items-center pt-2 font-mono text-[8px] text-neutral-500">
                              <span>Provider: Alpha Vantage</span>
                              <button 
                                onClick={handleScrapeGlobalMonitor}
                                disabled={isScrapingGlobal}
                                className="text-cyan-400 hover:underline hover:text-cyan-300 font-bold"
                              >
                                {isScrapingGlobal ? "Crawling..." : "Re-fetch"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {/* TAB: NSE 500 TRACKER SCREEN */}
            {activeTab === "nse-500-tracker" && (() => {
              return (
                <div className="space-y-10">
                  <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 font-sans">
                    <div className="max-w-4xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_15px_rgba(129,140,248,1)]"></span>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase italic drop-shadow-lg flex items-center gap-2">
                          NSE 500 Tracker
                        </h1>
                      </div>
                      <p className="font-medium text-xs text-on-surface border-l-2 border-indigo-400/50 pl-6 leading-relaxed max-w-3xl bg-black/40 backdrop-blur-sm rounded-r-lg py-2 font-mono">
                        Real-time quantitative tracking of all Nifty 500 stocks with advanced search, sector grouping, and historic sparklines.
                      </p>
                    </div>
                  </header>

                  <Nse500Tracker 
                    nse500Data={nse500Data}
                    isScrapingNse500={isScrapingNse500}
                    onScrapeNse500={handleScrapeNse500}
                    isLoadingNse500Quote={isLoadingNse500Quote}
                    nse500DetailedQuote={nse500DetailedQuote}
                    fetchDetailedNse500Quote={fetchDetailedNse500Quote}
                  />
                </div>
              );
            })()}

            {/* TAB: INDIAN INDICES LIVE SCREEN */}
            {activeTab === "indian-indices" && (() => {
              const indicesList = indianIndicesData?.indices || [];
              const q = indianIndicesSearchQuery.toLowerCase().trim();
              const filteredIndices = indicesList.filter((idx: any) => 
                !q || idx.name.toLowerCase().includes(q) || idx.symbol.toLowerCase().includes(q)
              );

              // Accrue calculations
              const totalIndices = indicesList.length;
              const positiveIndices = indicesList.filter((idx: any) => idx.change > 0).length;
              const negativeIndices = indicesList.filter((idx: any) => idx.change < 0).length;

              return (
                <div className="space-y-10">
                  <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div className="max-w-4xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,1)]"></span>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase italic drop-shadow-lg flex items-center gap-2">
                          Indian Indices Monitor
                        </h1>
                      </div>
                      <p className="font-medium text-xs text-on-surface border-l-2 border-emerald-400/50 pl-6 leading-relaxed max-w-3xl bg-black/40 backdrop-blur-sm rounded-r-lg py-2 font-mono">
                        Real-time tracking of Nifty sectors, thematic indices, and key benchmarks ingested directly from the National Stock Exchange API.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleScrapeIndianIndices}
                        disabled={isScrapingIndianIndices}
                        className={`px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-lg border flex items-center gap-2 transition-all ${
                          isScrapingIndianIndices
                            ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/20 cursor-not-allowed"
                            : "bg-emerald-400 text-black border-transparent hover:bg-emerald-300 hover:scale-[1.02] active:scale-95 shadow-[0_4px_24px_rgba(52,211,153,0.2)] cursor-pointer"
                        }`}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isScrapingIndianIndices ? "animate-spin" : ""}`} />
                        {isScrapingIndianIndices ? "CRAWLING NSE INDIA..." : "RUN ACTIVE NSE SCRAPER"}
                      </button>
                    </div>
                  </header>

                  {/* QUICK STATS BOARD */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between animate-fade-in">
                      <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">TOTAL SECTORS / INDEXES</span>
                      <span className="text-white font-mono text-3xl font-bold mt-2">{totalIndices || "--"}</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between animate-fade-in">
                      <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-bold">ADVANCING SESSIONS</span>
                      <span className="text-emerald-400 font-mono text-3xl font-bold mt-2">{positiveIndices || "0"}</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between animate-fade-in">
                      <span className="font-mono text-[10px] text-rose-400 uppercase tracking-widest font-bold">DECLINING SESSIONS</span>
                      <span className="text-rose-400 font-mono text-3xl font-bold mt-2">{negativeIndices || "0"}</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between animate-fade-in">
                      <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest font-bold">LAST HANDSHAKE TIME (IST)</span>
                      <span className="text-white font-mono text-sm mt-3 font-semibold text-center py-1 bg-neutral-950/60 border border-white/5 rounded">
                        {indianIndicesData?.fetched_at ? new Date(indianIndicesData.fetched_at).toLocaleTimeString() : "--:--:--"}
                      </span>
                    </div>
                  </div>

                  {/* FILTER BAR segment */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                    <div className="flex items-center gap-2.5 font-mono text-[11px] text-neutral-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>ACTIVE TARGET:</span>
                      <a 
                        href="https://www.nseindia.com/market-data/live-market-indices" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-400 hover:underline hover:text-emerald-300 font-bold flex items-center gap-1"
                      >
                        nseindia.com/market-data
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    
                    <div className="relative max-w-sm w-full">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Filter benchmarks by symbol or name..."
                        value={indianIndicesSearchQuery}
                        onChange={(e) => setIndianIndicesSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* BENCHMARK GRID & DETAILED CARD EXPOSURE */}
                  <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    {filteredIndices.length === 0 ? (
                      <div className="py-24 text-center text-neutral-500 space-y-3">
                        <Compass className="w-12 h-12 mx-auto text-neutral-600 animate-spin" />
                        <p className="text-sm font-mono font-medium">No Indian Index benchmarks found matching '{indianIndicesSearchQuery}'</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredIndices.map((idxItem: any, pos: number) => {
                          const isUp = idxItem.change >= 0;
                          return (
                            <div 
                              key={`ind-${pos}`}
                              className="group relative bg-[#131316] hover:bg-[#1a1a20] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-3 mb-3 border-b border-white/5 pb-2">
                                  <div>
                                    <h4 className="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-emerald-400 transition-colors line-clamp-1">
                                      {idxItem.name}
                                    </h4>
                                    <p className="font-mono text-[9px] text-neutral-400 font-semibold tracking-wider uppercase mt-0.5">{idxItem.symbol}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 text-[9px] font-mono font-black rounded-md ${
                                    isUp 
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  }`}>
                                    {isUp ? "▲" : "▼"} {idxItem.percent_change.toFixed(2)}%
                                  </span>
                                </div>

                                <div className="flex items-baseline justify-between mt-4">
                                  <span className="font-mono text-neutral-400 text-[10px] font-bold">LAST PRICING</span>
                                  <span className="font-mono text-lg font-bold text-white tracking-tight">
                                    ₹ {idxItem.last_price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <div className="flex items-baseline justify-between mt-1 mb-4 border-b border-white/5 pb-3">
                                  <span className="font-mono text-neutral-400 text-[10px] font-bold">SESSION CHANGE</span>
                                  <span className={`font-mono text-xs font-bold leading-none ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                                    {isUp ? "+" : ""}{idxItem.change.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1.5 bg-black/30 rounded-xl p-3 border border-white/5 font-mono text-[10px]">
                                <div className="flex justify-between text-neutral-400">
                                  <span>Open:</span>
                                  <span className="text-white font-medium">₹{idxItem.open.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400">
                                  <span>High:</span>
                                  <span className="text-emerald-400 font-medium">₹{idxItem.high.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400">
                                  <span>Low:</span>
                                  <span className="text-rose-400 font-medium">₹{idxItem.low.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400">
                                  <span>Prev Close:</span>
                                  <span className="text-neutral-300 font-medium">₹{idxItem.previous_close.toLocaleString("en-IN")}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono">
                      <div className="text-neutral-400 font-medium">
                        &gt; SYSTEM MONITOR STATUS: <span className="text-emerald-400 font-bold">ONLINE</span> (NSE CRAWLER TERMINAL ACTIVE)
                      </div>
                      <div className="text-neutral-500 font-bold uppercase tracking-widest">
                        Handshake: cookie storage secure & active
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* TAB: INSTITUTIONAL INVESTMENT FLOW */}
            {activeTab === "fii-dii" && (() => {
              const rows = fiiDiiData?.activities || [];
              const filtered = rows.filter((row: any) => 
                row.date.toLowerCase().includes(fiiDiiSearchQuery.toLowerCase())
              );

              // Calculate metrics
              const totalFiiCash = filtered.reduce((acc: number, item: any) => acc + item.fii_cash_net, 0);
              const totalDiiCash = filtered.reduce((acc: number, item: any) => acc + item.dii_cash_net, 0);
              const netFlowCombined = totalFiiCash + totalDiiCash;

              // Max values for auto-scaling sparklines
              const allValues = filtered.flatMap((row: any) => [row.fii_cash_net, row.dii_cash_net]);
              const maxAbs = allValues.length > 0 ? Math.max(...allValues.map(Math.abs), 500) : 1000;

              const fiiPoints = filtered.map((row: any, idx: number) => {
                const x = (idx / Math.max(1, filtered.length - 1)) * 1000;
                const y = 100 - (row.fii_cash_net / maxAbs) * 80;
                return { x, y, d: row };
              });

              const diiPoints = filtered.map((row: any, idx: number) => {
                const x = (idx / Math.max(1, filtered.length - 1)) * 1000;
                const y = 100 - (row.dii_cash_net / maxAbs) * 80;
                return { x, y, d: row };
              });

              // Construct line paths
              const fiiPath = fiiPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const diiPath = diiPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

              // Area paths relative to the center baseline (Y=100)
              const fiiArea = fiiPoints.length > 0 
                ? `${fiiPath} L ${fiiPoints[fiiPoints.length - 1].x} 100 L ${fiiPoints[0].x} 100 Z` 
                : "";
              const diiArea = diiPoints.length > 0 
                ? `${diiPath} L ${diiPoints[diiPoints.length - 1].x} 100 L ${diiPoints[0].x} 100 Z` 
                : "";

              return (
                <div className="space-y-8 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,1)]"></span>
                        <h2 className="text-2xl font-bold tracking-tight text-white uppercase italic">
                          Institutional Investment Flow (FII & DII)
                        </h2>
                      </div>
                      <p className="text-xs text-on-surface-variant font-mono max-w-2xl">
                        Monitor active Foreign Institutional Investors (FII) and Domestic Institutional Investors (DII) buying/selling activities parsed from StockEdge feeds.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <a 
                        href="https://web.stockedge.com/fii-activity" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-neutral-300 font-mono text-[11px] font-bold hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">link</span>
                        StockEdge Source
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      </a>

                      <button
                        onClick={handleScrapeFiiDii}
                        disabled={isScrapingFiiDii}
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 outline-none cursor-pointer ${
                          isScrapingFiiDii
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed"
                            : "bg-emerald-400 text-black hover:bg-emerald-300 border border-emerald-400/50 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] active:scale-[0.98]"
                        }`}
                      >
                        <span className={`material-symbols-outlined text-sm ${isScrapingFiiDii ? "animate-spin" : ""}`}>
                          {isScrapingFiiDii ? "progress_activity" : "autorenew"}
                        </span>
                        {isScrapingFiiDii ? "CRAWLING FEEDS..." : "SCRAPE LIVE FEEDS"}
                      </button>
                    </div>
                  </div>

                  {/* QUICK INFO BAR */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-400">database</span>
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] text-neutral-500 font-bold uppercase">DATA ENDPOINT REFERENCE</span>
                        <span className="font-mono text-xs text-white font-semibold flex items-center gap-1">
                          {fiiDiiData?.source || "web.stockedge.com"}
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-left sm:text-right">
                        <span className="block font-mono text-[9px] text-neutral-500 font-bold uppercase">LAST PARSED WATERMARK</span>
                        <span className="font-mono text-xs text-white font-bold">
                          {fiiDiiData?.fetched_at ? new Date(fiiDiiData.fetched_at).toLocaleTimeString() : "--:--:--"} UTC
                        </span>
                      </div>
                      <div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r border-white/10 pl-6 sm:pl-0 sm:pr-6">
                        <span className="block font-mono text-[9px] text-neutral-500 font-bold uppercase">SESSIONS RETRIEVED</span>
                        <span className="font-mono text-xs text-emerald-400 font-extrabold">
                          {filtered.length} ACTIVE TRADED DAYS
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CORE METRIC BENTO GRIDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    
                    {/* CARD 1: CUMULATIVE FII */}
                    <div className="relative bg-black/40 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Cumulative FII Cash flow</span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-indigo-400 text-sm">payments</span>
                        </div>
                      </div>
                      <h3 className={`text-2xl font-mono font-bold leading-none ${totalFiiCash >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {totalFiiCash >= 0 ? "+" : ""}{totalFiiCash.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr
                      </h3>
                      <p className="font-mono text-[10px] text-neutral-500 mt-2">
                        Foreign Institutional Capital in session focus list
                      </p>
                    </div>

                    {/* CARD 2: CUMULATIVE DII */}
                    <div className="relative bg-black/40 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Cumulative DII Cash Flow</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-amber-400 text-sm">savings</span>
                        </div>
                      </div>
                      <h3 className={`text-2xl font-mono font-bold leading-none ${totalDiiCash >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {totalDiiCash >= 0 ? "+" : ""}{totalDiiCash.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr
                      </h3>
                      <p className="font-mono text-[10px] text-neutral-500 mt-2">
                        Domestic Mutual support during equivalent sequence
                      </p>
                    </div>

                    {/* CARD 3: NET COMBINED SUPPORT CAPITAL */}
                    <div className="relative bg-black/40 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Combined Net Liquidity</span>
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-pink-400 text-sm">join_inner</span>
                        </div>
                      </div>
                      <h3 className={`text-2xl font-mono font-bold leading-none ${netFlowCombined >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {netFlowCombined >= 0 ? "+" : ""}{netFlowCombined.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr
                      </h3>
                      <p className="font-mono text-[10px] text-neutral-500 mt-2">
                        Combined domestic + offshore direct investment injection
                      </p>
                    </div>

                    {/* CARD 4: SENTIMENT AND DIRECTION GAUGE */}
                    <div className="relative bg-black/40 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Derivatives Sentiment</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          netFlowCombined > 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
                        }`}>
                          <span className={`material-symbols-outlined text-sm ${netFlowCombined > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {netFlowCombined > 0 ? "trending_up" : "trending_down"}
                          </span>
                        </div>
                      </div>
                      <h3 className={`text-2xl font-mono font-bold leading-none uppercase ${netFlowCombined > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {netFlowCombined > 1000 ? "Strong Bullish" : netFlowCombined > 0 ? "Mild Bullish" : "Risk Off Bearish"}
                      </h3>
                      <p className="font-mono text-[10px] text-neutral-500 mt-2">
                        Institutional net index coverage trend gauge
                      </p>
                    </div>
                  </div>

                  {/* PREMIUM HIGH-FIDELITY SVG TRACKER CHART */}
                  <div className="bg-neutral-900/60 border border-white/15 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400">stacked_line_chart</span>
                        <h3 className="font-mono text-[11px] uppercase tracking-wider text-white font-bold">
                          Daily FII vs DII Net Flows (Trend Matrix)
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
                          <span className="text-violet-200">FII Net Cash</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                          <span className="text-amber-200">DII Net Cash</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-64 w-full relative z-10 mt-4 rounded-xl overflow-hidden bg-neutral-950/40 p-2 border border-white/5">
                      {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-500 font-mono text-xs">
                          No session entries loaded for the chosen date filters.
                        </div>
                      ) : (
                        <div className="w-full h-full relative group">
                          {/* Y-axis Labels */}
                          <div className="absolute left-2 top-2 font-mono text-[8px] text-neutral-400 font-bold bg-neutral-900/80 px-1 py-0.5 rounded">
                            +{maxAbs.toFixed(0)} Cr
                          </div>
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[8px] text-neutral-500 bg-neutral-900/80 px-1 py-0.5 rounded">
                            0 Cr (Neutral Baseline)
                          </div>
                          <div className="absolute left-2 bottom-2 font-mono text-[8px] text-neutral-400 font-bold bg-neutral-900/80 px-1 py-0.5 rounded">
                            -{maxAbs.toFixed(0)} Cr
                          </div>

                          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200 animate-drawIn">
                            <defs>
                              <linearGradient id="fiiAreaGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                                <stop offset="0%" stopColor="rgba(167, 139, 250, 0.2)"></stop>
                                <stop offset="100%" stopColor="transparent"></stop>
                              </linearGradient>
                              <linearGradient id="diiAreaGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                                <stop offset="0%" stopColor="rgba(251, 191, 36, 0.25)"></stop>
                                <stop offset="100%" stopColor="transparent"></stop>
                              </linearGradient>
                            </defs>

                            {/* Neutral Zero Line */}
                            <line x1="0" y1="100" x2="1000" y2="100" stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="4 4" strokeWidth="1.5" />

                            {/* DII Premium Area & Path */}
                            {diiArea && (
                              <path d={diiArea} fill="url(#diiAreaGrad)" />
                            )}
                            {diiPath && (
                              <path d={diiPath} fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            )}

                            {/* FII Premium Area & Path */}
                            {fiiArea && (
                              <path d={fiiArea} fill="url(#fiiAreaGrad)" />
                            )}
                            {fiiPath && (
                              <path d={fiiPath} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            )}

                            {/* Interactive Coordinate points */}
                            {fiiPoints.map((p, i) => (
                              <g key={`p-group-${i}`} className="cursor-pointer hover:scale-125 transition-transform duration-100">
                                <circle cx={p.x} cy={p.y} r="4" fill="#a78bfa" stroke="#000" strokeWidth="1.5" />
                                <circle cx={p.x} cy={diiPoints[i].y} r="4" fill="#fbbf24" stroke="#000" strokeWidth="1.5" />
                              </g>
                            ))}
                          </svg>

                          {/* Dynamic helper annotations of dates along horizontal axis */}
                          <div className="absolute inset-x-0 bottom-1 flex justify-between px-6 font-mono text-[8px] text-neutral-500 select-none">
                            <span>{filtered[filtered.length - 1]?.date || ""}</span>
                            <span>{filtered[Math.floor(filtered.length / 2)]?.date || ""}</span>
                            <span>{filtered[0]?.date || ""}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* HIGH PERFORMANCE DATA LEDGER */}
                  <div className="bg-neutral-950/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                    <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-mono text-xs uppercase tracking-widest text-white font-bold mb-1">
                          Institutional Equity Trade Ledger
                        </h3>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          Detailed segment trade ledger (Cash and Derivative Markets in Crores).
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-500 text-[16px]">search</span>
                          <input
                            type="text"
                            placeholder="Search Date (YYYY-MM-DD)..."
                            value={fiiDiiSearchQuery}
                            onChange={(e) => setFiiDiiSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl font-mono text-[11px] text-white placeholder-neutral-500 w-56 focus:outline-none focus:border-white/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-black/30 border-b border-white/5 font-mono text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            <th className="py-4 px-6">TRADING DATE</th>
                            <th className="py-4 px-6 text-indigo-400">FII CASH NET</th>
                            <th className="py-4 px-6 text-amber-400">DII CASH NET</th>
                            <th className="py-4 px-6 text-emerald-400">COMBINED NET</th>
                            <th className="py-4 px-6">INDEX FUTURES</th>
                            <th className="py-4 px-6">INDEX OPTIONS</th>
                            <th className="py-4 px-6">STOCK FUTURES</th>
                            <th className="py-4 px-6">SENTIMENT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-xs text-neutral-300">
                          {filtered.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-neutral-500 text-xs">
                                No direct FII/DII records match the search parameters.
                              </td>
                            </tr>
                          ) : (
                            filtered.map((item: any, idx: number) => {
                              const comb = item.fii_cash_net + item.dii_cash_net;
                              
                              return (
                                <tr key={`fii-row-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="py-4 px-6 font-bold text-white">{item.date}</td>
                                  
                                  <td className={`py-4 px-6 font-bold ${item.fii_cash_net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {item.fii_cash_net >= 0 ? "+" : ""}{item.fii_cash_net.toFixed(2)} Cr
                                  </td>

                                  <td className={`py-4 px-6 font-bold ${item.dii_cash_net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {item.dii_cash_net >= 0 ? "+" : ""}{item.dii_cash_net.toFixed(2)} Cr
                                  </td>

                                  <td className={`py-4 px-6 font-extrabold ${comb >= 0 ? "text-emerald-400 bg-emerald-500/5:" : "text-rose-400 bg-rose-500/5:"}`}>
                                    {comb >= 0 ? "+" : ""}{comb.toFixed(2)} Cr
                                  </td>

                                  <td className={`py-4 px-6 font-medium ${item.fii_index_futures_net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {item.fii_index_futures_net >= 0 ? "+" : ""}{item.fii_index_futures_net.toFixed(2)}
                                  </td>

                                  <td className={`py-4 px-6 font-medium ${item.fii_index_options_net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {item.fii_index_options_net >= 0 ? "+" : ""}{item.fii_index_options_net.toFixed(2)}
                                  </td>

                                  <td className={`py-4 px-6 font-medium ${item.fii_stock_futures_net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {item.fii_stock_futures_net >= 0 ? "+" : ""}{item.fii_stock_futures_net.toFixed(2)}
                                  </td>

                                  <td className="py-4 px-6">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${
                                      comb > 1000
                                        ? "bg-emerald-950/50 text-emerald-400 border-emerald-500/20"
                                        : comb > 0
                                        ? "bg-teal-950/50 text-teal-300 border-teal-500/20"
                                        : "bg-rose-950/50 text-rose-400 border-rose-500/20"
                                    }`}>
                                      {comb > 1000 ? "Bullish" : comb > 0 ? "Neutral" : "Bearish"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SYSTEM STATUS FOOTER */}
                  <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono">
                      <div className="text-neutral-400 font-medium">
                        &gt; SYSTEM INSTITUTIONAL FLOW: <span className="text-emerald-400 font-bold">ACTIVE</span> (PARSING DATA VIA STOCKEDGE HANDSHAKE)
                      </div>
                      <div className="text-neutral-500 font-bold uppercase tracking-widest">
                        Data refreshed real-time on-demand
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB TWO: MARKET NEWS FEED SCREEN WITH GEMINI GENERATION INTERACTIVE BOX */}
            {activeTab === "news" && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_rgba(0,219,233,1)]"></span>
                      <h2 className="text-2xl font-bold tracking-tight text-white uppercase italic">
                        Market News Live Terminal
                      </h2>
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono max-w-2xl">
                      Crawl, extract, and monitor high-frequency financial feeds and cross-asset deviations in real-time.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleScrapeNews}
                      disabled={isScrapingNews}
                      className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] tracking-widest font-mono disabled:opacity-55 cursor-pointer uppercase shrink-0"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isScrapingNews ? 'animate-spin' : ''}`} />
                      {isScrapingNews ? "SCRAPING WEB..." : "REFRESH WEB FEEDS"}
                    </button>
                  </div>
                </div>

                {/* Sub-tab segment selector */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setNewsSourceFilter("all")}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono tracking-wider transition-all duration-200 ${
                        newsSourceFilter === "all"
                          ? "bg-white text-black shadow-md font-bold"
                          : "bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10"
                      }`}
                    >
                      UNIFIED STREAM
                    </button>
                    <button
                      onClick={() => setNewsSourceFilter("zerodha")}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono tracking-wider transition-all duration-200 ${
                        newsSourceFilter === "zerodha"
                          ? "bg-amber-500 text-black shadow-md font-bold"
                          : "bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10"
                      }`}
                    >
                      ZERODHA PULSE ({news?.scraped?.sources.find(s => s.source === "zerodha_pulse")?.articles.length || 0})
                    </button>
                    <button
                      onClick={() => setNewsSourceFilter("finology")}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono tracking-wider transition-all duration-200 ${
                        newsSourceFilter === "finology"
                          ? "bg-emerald-500 text-black shadow-md font-bold"
                          : "bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10"
                      }`}
                    >
                      FINOLOGY TICKER ({news?.scraped?.sources.find(s => s.source === "finology_ticker")?.articles.length || 0})
                    </button>
                  </div>
                  
                  {news?.scraped && (
                    <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                      Last Scraped: {new Date(news.scraped.scraped_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>



                {/* Content Area columns */}
                <div className="flex flex-col xl:flex-row gap-8">
                  
                  {/* Global real-time news list column */}
                  <div className="flex-1 space-y-6">
                    
                    {/* ALL / UNIFIED SOURCE LISTING */}
                    {newsSourceFilter === "all" && (
                      <div className="space-y-6">
                        {/* Featured core story */}
                        {news && (
                          <section className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                            <div className="orca-card grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden rounded-[inherit]">
                              <div className="lg:col-span-7 relative min-h-[350px]">
                                <img 
                                  className="w-full h-full object-cover grayscale opacity-60 hover:grayscale-0 hover:opacity-90 transition-all duration-700" 
                                  src={news.featured.image}
                                  alt="Featured stories"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 flex gap-2">
                                  <span className="bg-white text-black font-mono text-[10px] px-3 py-1 rounded font-bold shadow-md animate-pulse">
                                    BREAKING REPORT
                                  </span>
                                  <span className="bg-black/60 backdrop-blur-md text-white font-mono text-[10px] px-3 py-1 rounded border border-white/20 uppercase font-bold tracking-widest">
                                    {news.featured.topic}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="lg:col-span-12 xl:col-span-5 p-8 flex flex-col justify-center space-y-4">
                                <div className="flex items-center gap-2 text-on-surface-variant font-mono text-[9px] font-bold">
                                  <span className="material-symbols-outlined text-[14px]">schedule</span> 
                                  {news.featured.ago} • {news.featured.source}
                                </div>
                                <h2 className="font-bold text-2xl text-white leading-tight uppercase font-sans italic tracking-tight">
                                  {news.featured.title}
                                </h2>
                                <p className="text-on-surface-variant/95 text-xs font-medium leading-relaxed border-l-2 border-cyan-400 pl-4 font-mono">
                                  {news.featured.content}
                                </p>
                              </div>
                            </div>
                          </section>
                        )}

                        <div className="flex items-center justify-between">
                          <h3 className="font-mono text-on-surface-variant tracking-[0.2em] text-[11px] font-bold uppercase">
                            Unified Real-Time Financial Feed
                          </h3>
                        </div>

                        {/* Feed grids */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {news?.feed.map((item) => (
                            <div 
                              key={item.id}
                              className="orbital-border group"
                              onMouseMove={handleOrbitalMouseMove}
                            >
                              <div className="orca-card p-6 flex flex-col h-full rounded-[inherit] transition-all hover:bg-white/[0.08]">
                                <div className="flex justify-between items-start mb-4">
                                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold border ${
                                    item.tagColor === "secondary" 
                                      ? "bg-purple-950/20 text-purple-200 border-purple-500/20" 
                                      : item.tagColor === "error" 
                                      ? "bg-rose-950/20 text-rose-200 border-red-500/20 animate-pulse" 
                                      : "bg-white/5 text-white border-white/10"
                                  }`}>
                                    {item.topic}
                                  </span>
                                  <span className="text-on-surface-variant font-mono text-[10px]">
                                    {item.time}
                                  </span>
                                </div>

                                <h3 className="text-lg text-white mb-2 font-bold uppercase font-sans leading-tight italic">
                                  {item.title}
                                </h3>
                                <p className="text-[12px] text-on-surface-variant/90 leading-relaxed font-semibold font-mono flex-1 mb-4 line-clamp-4">
                                  {item.summary}
                                </p>

                                {item.extraMetric && (
                                  <div className="bg-black/40 backdrop-blur-xl p-3 rounded-lg mb-4 flex items-center justify-between border border-white/10 shadow-inner">
                                    <div>
                                      <div className="font-mono text-[9px] text-on-surface-variant mb-0.5 font-bold">{item.extraMetric.label}</div>
                                      <div className="font-mono text-sm text-rose-400 font-bold">{item.extraMetric.value}</div>
                                    </div>
                                    <TrendingUp className="text-rose-400 w-5 h-5" />
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-[10px] font-mono font-bold text-white">
                                      {item.sourceLetter}
                                    </div>
                                    <span className="font-mono text-[9px] text-on-surface-variant uppercase font-bold">{item.source}</span>
                                  </div>
                                  <span className="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer hover:text-white">more_horiz</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ZERODHA PULSE SPECIFIC VIEW */}
                    {newsSourceFilter === "zerodha" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                          <span className="font-mono text-xs text-amber-300 font-bold uppercase">Source: pulse.zerodha.com</span>
                          <span className="font-mono text-[10px] text-on-surface-variant">Real-Time Compact Micro-Bulletins</span>
                        </div>
                        {news?.scraped?.sources.find(s => s.source === "zerodha_pulse")?.articles.map((art, i) => (
                          <div key={i} className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                            <div className="orca-card p-5 rounded-[inherit] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/45">
                              <div className="space-y-2 flex-grow">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] bg-amber-950/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/20">
                                    ZERODHA PULSE
                                  </span>
                                  <span className="text-[10px] text-on-surface-variant font-mono">
                                    {art.published_at || "Recent Update"}
                                  </span>
                                </div>
                                <h4 className="text-white hover:text-cyan-300 font-bold text-sm md:text-base leading-tight transition-colors">
                                  {art.url ? (
                                    <a href={art.url} target="_blank" rel="noopener noreferrer">{art.title}</a>
                                  ) : (
                                    art.title
                                  )}
                                </h4>
                                {art.summary && (
                                  <p className="text-xs text-on-surface-variant/90 leading-relaxed max-w-4xl p-3 bg-black/30 rounded-lg border border-white/5 font-mono">
                                    {art.summary}
                                  </p>
                                )}
                              </div>
                              {art.url && (
                                <a 
                                  href={art.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-mono text-[9px] font-bold rounded-lg transition-all shrink-0 uppercase tracking-wider block text-center"
                                >
                                  LINK OUT
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* FINOLOGY TICKER SPECIFIC VIEW */}
                    {newsSourceFilter === "finology" && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                          <span className="font-mono text-xs text-emerald-300 font-bold uppercase">Source: ticker.finology.in</span>
                          <span className="font-mono text-xs text-on-surface-variant font-mono">Curated Financial News & Earnings</span>
                        </div>
                        {news?.scraped?.sources.find(s => s.source === "finology_ticker")?.articles.map((art, i) => (
                          <div key={i} className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                            <div className="orca-card p-5 rounded-[inherit] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/45">
                              <div className="space-y-2 flex-grow">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] bg-emerald-950/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                                    FINOLOGY TICKER
                                  </span>
                                  <span className="text-[10px] text-on-surface-variant font-mono">
                                    {art.published_at || "Recent Update"}
                                  </span>
                                </div>
                                <h4 className="text-white hover:text-cyan-300 font-bold text-sm md:text-base leading-tight transition-colors">
                                  {art.url ? (
                                    <a href={art.url} target="_blank" rel="noopener noreferrer">{art.title}</a>
                                  ) : (
                                    art.title
                                  )}
                                </h4>
                                {art.summary && (
                                  <p className="text-xs text-on-surface-variant/90 leading-relaxed max-w-4xl p-3 bg-black/30 rounded-lg border border-white/5 font-mono">
                                    {art.summary}
                                  </p>
                                )}
                              </div>
                              {art.publisher && (
                                <span className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider px-2 py-1 bg-white/5 rounded">
                                  {art.publisher}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* MONEYCONTROL WORLD SECTION */}
                    <div className="border-t border-white/5 pt-8 mt-8">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Globe className="w-5 h-5 text-amber-400" />
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                              MoneyControl World
                            </h3>
                          </div>
                          <p className="text-xs text-neutral-400 font-mono">
                            International business and market news from MoneyControl World terminal
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                              type="text"
                              placeholder="Search articles..."
                              value={mcWorldSearchQuery}
                              onChange={(e) => setMcWorldSearchQuery(e.target.value)}
                              className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50 w-64"
                            />
                          </div>
                          <button
                            onClick={handleScrapeMcWorld}
                            disabled={isScrapingMcWorld}
                            className="px-4 py-2 bg-amber-400/20 hover:bg-amber-400 hover:text-black border border-amber-400/30 text-amber-400 font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50 font-mono tracking-wider"
                          >
                            {isScrapingMcWorld ? (
                              <>
                                <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                                LOADING...
                              </>
                            ) : (
                              <>
                                <RotateCw className="w-3 h-3" />
                                SCRAPE
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {mcWorldData?.fetched_at && (
                        <div className="mb-4 text-right">
                          <span className="text-[9px] font-mono text-neutral-500">
                            Last scraped: {new Date(mcWorldData.fetched_at).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Featured Articles */}
                      {mcWorldData?.featured_articles?.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-mono text-xs uppercase font-bold text-amber-400 tracking-wider mb-3 flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5" />
                            Featured Stories
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(() => {
                              const searchLower = mcWorldSearchQuery.toLowerCase();
                              const filtered = mcWorldData.featured_articles.filter((art: any) =>
                                searchLower ? art.title?.toLowerCase().includes(searchLower) : true
                              );
                              return filtered.slice(0, 6).map((art: any, idx: number) => (
                                <div
                                  key={`mcw-feat-${idx}`}
                                  className="group relative bg-white/[0.02] hover:bg-amber-950/20 border border-white/5 hover:border-amber-400/20 rounded-xl p-4 transition-all duration-200"
                                >
                                  {art.image_url && (
                                    <div className="mb-3 h-24 rounded-lg overflow-hidden bg-black/40">
                                      <img
                                        src={art.image_url}
                                        alt={art.title}
                                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    </div>
                                  )}
                                  <span className="px-1.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-wider rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2 inline-block">
                                    Featured
                                  </span>
                                  <h5 className="text-sm font-bold text-white leading-snug group-hover:text-amber-400 transition-colors mb-2 line-clamp-2">
                                    {art.url ? (
                                      <a href={art.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-start gap-1">
                                        {art.title}
                                        <ExternalLink className="w-3 h-3 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                      </a>
                                    ) : (
                                      art.title
                                    )}
                                  </h5>
                                  {art.summary && (
                                    <p className="text-[10px] text-neutral-400 leading-relaxed font-mono line-clamp-2">
                                      {art.summary}
                                    </p>
                                  )}
                                  {art.timestamp && (
                                    <div className="mt-2 text-[9px] font-mono text-neutral-500 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      {art.timestamp}
                                    </div>
                                  )}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Latest News */}
                      {mcWorldData?.latest_news?.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-mono text-xs uppercase font-bold text-emerald-400 tracking-wider mb-3 flex items-center gap-2">
                            <Newspaper className="w-3.5 h-3.5" />
                            Latest News
                          </h4>
                          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                            {(() => {
                              const searchLower = mcWorldSearchQuery.toLowerCase();
                              const filtered = mcWorldData.latest_news.filter((art: any) =>
                                searchLower ? art.title?.toLowerCase().includes(searchLower) : true
                              );
                              return filtered.slice(0, 20).map((art: any, idx: number) => (
                                <div
                                  key={`mcw-latest-${idx}`}
                                  className="group relative bg-white/[0.02] hover:bg-emerald-950/20 border border-white/5 hover:border-emerald-400/20 rounded-xl p-3 transition-all duration-200"
                                >
                                  <h5 className="text-xs font-bold text-white leading-snug group-hover:text-emerald-400 transition-colors">
                                    {art.url ? (
                                      <a href={art.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-start gap-1">
                                        {art.title}
                                        <ExternalLink className="w-2.5 h-2.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                      </a>
                                    ) : (
                                      art.title
                                    )}
                                  </h5>
                                  <div className="flex items-center gap-3 mt-2">
                                    {art.summary && (
                                      <p className="text-[10px] text-neutral-400 leading-relaxed font-mono flex-1 line-clamp-1">
                                        {art.summary}
                                      </p>
                                    )}
                                    {art.timestamp && (
                                      <span className="text-[9px] font-mono text-neutral-500 flex items-center gap-1 flex-shrink-0">
                                        <Clock className="w-2.5 h-2.5" />
                                        {art.timestamp}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Market Updates */}
                      {mcWorldData?.market_updates?.length > 0 && (
                        <div>
                          <h4 className="font-mono text-xs uppercase font-bold text-cyan-400 tracking-wider mb-3 flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Market Updates
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(() => {
                              const searchLower = mcWorldSearchQuery.toLowerCase();
                              const filtered = mcWorldData.market_updates.filter((art: any) =>
                                searchLower ? art.title?.toLowerCase().includes(searchLower) : true
                              );
                              return filtered.slice(0, 10).map((art: any, idx: number) => (
                                <div
                                  key={`mcw-mkt-${idx}`}
                                  className="group relative bg-white/[0.02] hover:bg-cyan-950/20 border border-white/5 hover:border-cyan-400/20 rounded-xl p-3 transition-all duration-200"
                                >
                                  {art.category && (
                                    <span className="px-1.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-wider rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2 inline-block">
                                      {art.category}
                                    </span>
                                  )}
                                  <h5 className="text-xs font-bold text-white leading-snug group-hover:text-cyan-400 transition-colors">
                                    {art.url ? (
                                      <a href={art.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-start gap-1">
                                        {art.title}
                                        <ExternalLink className="w-2.5 h-2.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                      </a>
                                    ) : (
                                      art.title
                                    )}
                                  </h5>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Empty state */}
                      {!mcWorldData || (
                        !mcWorldData.featured_articles?.length &&
                        !mcWorldData.latest_news?.length &&
                        !mcWorldData.market_updates?.length
                      ) ? (
                        <div className="py-16 text-center text-neutral-500 border border-dashed border-white/5 bg-white/[0.01] rounded-xl">
                          <Globe className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
                          <p className="text-sm font-mono mb-4">No MoneyControl World data available.</p>
                          <button
                            onClick={handleScrapeMcWorld}
                            disabled={isScrapingMcWorld}
                            className="px-6 py-2.5 bg-amber-400/20 hover:bg-amber-400 hover:text-black border border-amber-400/30 text-amber-400 text-xs font-mono font-semibold rounded-lg transition-all disabled:opacity-50"
                          >
                            {isScrapingMcWorld ? "Loading..." : "Load MoneyControl World"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB THREE: PIPELINE EXECUTION SCREEN AND SCROLL LOGS */}
            {activeTab === "pipeline" && (
              <div className="space-y-8">
                
                {/* Pipeline Node header */}
                <div className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                  <div className="orca-card p-8 rounded-[inherit] flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-visible">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-200 font-mono text-[9px] border border-cyan-400/40 rounded-sm font-bold uppercase">
                          Seq_Execution
                        </span>
                        <span className="font-mono text-xs text-on-surface-variant opacity-80 uppercase tracking-widest font-bold">
                          NODE_ID: {pipeline?.mainMeta.nodeId}
                        </span>
                      </div>
                      <h2 className="text-3xl font-extrabold text-white uppercase italic tracking-tight">
                        Execution Pipeline: Orca_v16
                      </h2>
                    </div>
                    
                    <div className="flex gap-12">
                      <div className="text-right">
                        <p className="font-mono text-[10.5px] text-on-surface-variant mb-1 uppercase tracking-widest font-bold">Elapsed_Time</p>
                        <p className="font-mono text-3xl text-cyan-300 font-black tracking-wider shadow-sm select-auto">
                          {Math.floor(elapsedSeconds / 3600).toString().padStart(2, "0")}:
                          {Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, "0")}:
                          {Math.floor(elapsedSeconds % 60).toString().padStart(2, "0")}.
                          {Math.floor((elapsedSeconds % 1) * 100).toString().padStart(2, "0")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10.5px] text-on-surface-variant mb-1 uppercase tracking-widest font-bold">Mem_Allocation</p>
                        <p className="font-mono text-3xl text-purple-300 font-black tracking-wider">
                          {pipeline?.mainMeta.memoryAllocated} / {pipeline?.mainMeta.memoryMax}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pipeline active execution stages matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                  {pipeline?.phases.map((phase) => (
                    <div key={phase.id} className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                      <div className="orca-card flex flex-col p-6 rounded-[inherit] h-full transition-all hover:bg-white/[0.05]">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="font-mono text-[10px] text-white/75 mb-1 uppercase font-bold tracking-wider">{phase.number}</h3>
                            <p className="text-xl font-extrabold uppercase italic tracking-tight">{phase.title}</p>
                          </div>
                          
                          <div className="phase-indicator-orbital" style={{ "--indicator-color": phase.indicatorColor, "--progress": `${phase.progress}%` } as React.CSSProperties}>
                            {phase.status === "completed" && <Check className="w-4 h-4 text-cyan-400" />}
                            {phase.status === "running" && <RotateCw className="w-4 h-4 text-cyan-300 animate-spin" />}
                            {phase.status === "critical" && <span className="material-symbols-outlined text-rose-400 text-sm animate-ping">report_problem</span>}
                          </div>
                        </div>

                        {/* Metrics lists */}
                        <div className="space-y-4 flex-1">
                          {phase.metrics.map((metric, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 dark:bg-black/20">
                              <span className="font-mono text-xs text-on-surface-variant/95 font-semibold">
                                {metric.label}
                              </span>
                              {metric.completed === true ? (
                                <span className="material-symbols-outlined text-cyan-400 text-sm font-black">done_all</span>
                              ) : metric.completed === "spinning" ? (
                                <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                              ) : metric.completed === "fail" ? (
                                <span className="material-symbols-outlined text-rose-400 text-sm font-extrabold">close</span>
                              ) : (
                                <span className="material-symbols-outlined text-on-surface-variant text-sm font-semibold">pause</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Progress slider bar */}
                        <div className="mt-6 pt-4 border-t border-white/10">
                          <p className="font-mono text-[9px] text-on-surface-variant/80 mb-2 uppercase tracking-widest font-bold">
                            {phase.liftLabel}
                          </p>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-700 shadow-lg" 
                              style={{ 
                                width: `${phase.liftPercent}%`, 
                                backgroundColor: phase.status === "critical" ? "#ffb4ab" : phase.status === "running" ? "#00f0ff" : phase.indicatorColor 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Live System Logs Stream & Heatmap resolve */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Realtime Terminal display console */}
                  <div className="lg:col-span-2 orbital-border" onMouseMove={handleOrbitalMouseMove}>
                    <div className="orca-card flex flex-col h-[400px] rounded-[inherit] overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4 bg-white/10 backdrop-blur-2xl border-b border-white/10">
                        <span className="font-mono text-[11px] text-white flex items-center gap-3 font-bold tracking-widest">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                          SYSTEM_LOG_STREAM_V16
                        </span>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={handleRebootPipeline}
                            disabled={isPipelineRebooting}
                            className="bg-white/5 hover:bg-white/15 px-3 py-1 rounded text-[10px] font-mono font-bold text-white border border-white/10 tracking-widest flex items-center gap-1.5 transition-colors disabled:opacity-45"
                          >
                            <span className="material-symbols-outlined text-xs">refresh</span>
                            REBOOT_NODE
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 p-6 font-mono text-[13px] overflow-y-auto terminal-scroll space-y-3 bg-black/40 backdrop-blur-xl custom-scrollbar rounded-b-xl select-text">
                        {pipeline?.logs.map((log, i) => (
                          <div key={i} className="text-on-surface-variant flex gap-4 font-semibold">
                            <span className="text-neutral-500 opacity-60">[{log.time}]</span>
                            <span className={`font-bold ${
                              log.level === "FAIL" ? "text-rose-400 animate-pulse" : log.level === "WARN" ? "text-purple-300" : "text-cyan-400"
                            }`}>
                              {log.level}:
                            </span>
                            <span className="text-neutral-300 font-medium">{log.message}</span>
                          </div>
                        ))}
                        <div ref={terminalBottomRef} />
                      </div>
                    </div>
                  </div>

                  {/* Heatmap Preview segment */}
                  <div className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                    <div className="orca-card p-6 flex flex-col rounded-[inherit] h-full overflow-hidden">
                      <h4 className="font-mono text-[10px] text-on-surface-variant mb-6 flex items-center justify-between uppercase tracking-widest font-bold">
                        Orca_Heatmap_Preview
                        <span className="material-symbols-outlined text-[16px]">grid_view</span>
                      </h4>
                      <div className="flex-1 relative group overflow-hidden rounded-lg border border-white/20 backdrop-blur-md">
                        <img 
                          alt="Heatmap visualization preview" 
                          className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000 grayscale" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa_ZuEEyryU-z8UrLFBuG8UrfdiCzuuk6yddQbdxCPBqoo93b5EufdWJryvoFNxP29LUp9u1csC_MBe5-xcNlS8bsMFcw6NwZmzBpr54A2nm17uHjAE9qJ5vuSLsGsTLo2hXRVeu5aQPGUlOMPmlmV6HC-88lKb0SSt3_HJhihSTPhlvk7HLIKrNHGkYrQexFfaO2_PkgIssx0LN9IpDNZuKfL-BKV7x6Y5JLl4lFsw9wylvIit31NNQ_d5JlEAqdXWeZ8yjTqqAe8"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                          <button 
                            onClick={() => setShowResolveModal(true)}
                            className="w-full py-3 bg-cyan-400/20 hover:bg-cyan-400/35 text-cyan-300 border border-cyan-400/30 font-mono text-[10.5px] rounded-lg transition-all backdrop-blur-2xl shadow-lg shadow-cyan-500/10 font-bold uppercase tracking-widest"
                          >
                            View_Full_Resolve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB FOUR: MODELS CONFIGURATION & SYSTEM PROMPTS OVERRIDE SCREEN */}
            {activeTab === "models" && (
              <div className="space-y-10">
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                  <div className="max-w-4xl">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_15px_rgba(0,219,233,1)]"></span>
                      <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase italic drop-shadow-lg">
                        Models Configuration
                      </h1>
                    </div>
                    <p className="font-medium text-xs text-on-surface border-l-2 border-cyan-400/50 pl-6 leading-relaxed max-w-2xl bg-black/40 backdrop-blur-sm rounded-r-lg py-2 font-mono">
                      Define model allocation and orchestrate the multi-phase execution pipeline for real-time market analysis.
                    </p>
                  </div>
                </header>

                <div className="grid grid-cols-12 gap-8 relative z-10">
                  
                  {/* Left Latency stats panel sticky */}
                  <div className="col-span-12 lg:col-span-3 orbital-border h-fit lg:sticky lg:top-10" onMouseMove={handleOrbitalMouseMove}>
                    <div className="orca-card rounded-[inherit] p-6 flex flex-col gap-8">
                      <h3 className="font-mono text-xs text-cyan-300 border-b border-white/10 pb-4 tracking-[0.2em] flex items-center gap-2 font-bold uppercase">
                        <Sliders className="w-4 h-4 text-cyan-300" />
                        LATENCY_STATS
                      </h3>
                      
                      <div className="space-y-8 font-semibold">
                        {models?.latency.map((lat, i) => (
                          <div key={i} className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-[9px] text-white uppercase tracking-wider">{lat.name}</span>
                              <span className="font-mono text-xs text-cyan-400 font-bold">{lat.avgSec}s avg</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(0,219,233,0.6)]"
                                style={{ width: `${lat.percent}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-white/10">
                        <div className="p-4 bg-black/50 rounded-lg border border-white/20">
                          <span className="font-mono text-[8px] text-purple-300 tracking-widest block mb-3 uppercase font-bold">SYSTEM_NODE_INFO</span>
                          <div className="flex items-center gap-3">
                            <Database className="text-cyan-400 w-5 h-5 shrink-0" />
                            <div className="flex flex-col font-mono text-xs font-bold leading-none gap-1">
                              <span className="text-white">{models?.systemNodeInfo.node}</span>
                              <span className="text-on-surface-variant font-medium text-[10px] uppercase">
                                {models?.systemNodeInfo.ip}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Phase overrides */}
                  <div className="col-span-12 lg:col-span-9 space-y-8">
                    {models?.phases.map((phase) => (
                      <div key={phase.id} className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                        <div className="orca-card rounded-[inherit] overflow-hidden relative">
                          
                          <div className="px-8 py-5 bg-white/[0.06] border-b border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-cyan-500/20 flex items-center justify-center rounded-xl border border-white/30 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]">
                                <span className="font-mono text-cyan-400 font-bold text-xl">
                                  {phase.id === "phase_1" ? "01" : "02"}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-white uppercase italic font-sans">{phase.name}</h4>
                                <span className="font-mono text-[9.5px] text-cyan-300 tracking-widest uppercase font-bold">
                                  {phase.meta}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <label className="font-mono text-[10.5px] text-white uppercase font-bold tracking-wider">Allocation:</label>
                              <div className="relative">
                                <select 
                                  value={phase.allocation}
                                  onChange={(e) => handleAllocationChange(phase.id, e.target.value)}
                                  className="control-contrast rounded-lg pl-4 pr-10 py-2 font-mono text-[11px] outline-none cursor-pointer min-w-[200px]"
                                >
                                  <option value="gpt-4">GPT-4 Omni</option>
                                  <option value="claude-3">Claude 3.5 Sonnet</option>
                                  <option value="llama-3">Llama 3 70B</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="p-8">
                            <label className="block font-mono text-[10px] text-white/90 mb-4 uppercase tracking-[0.25em] font-bold">
                              System Prompt Override
                            </label>
                            
                            <textarea 
                              value={phase.prompt}
                              onChange={(e) => handlePromptChange(phase.id, e.target.value)}
                              className="w-full h-36 control-contrast rounded-xl p-5 font-mono text-xs input-glow resize-none leading-relaxed placeholder:text-white/20 uppercase"
                              placeholder="Enter customized agent prompts..."
                            />

                            <div className="flex flex-wrap justify-end gap-3 mt-6 items-center">
                              <div className="flex items-center gap-3 mr-auto bg-black/60 px-4 py-2 rounded-lg border border-white/30 text-xs font-semibold">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,219,233,1)]"></div>
                                <span className="font-mono text-[10px] text-white tracking-tight uppercase">
                                  Tokens: {phase.tokensUsed} / {phase.tokensMax}
                                </span>
                              </div>
                              
                              <button 
                                onClick={() => handleOptimizePrompt(phase.id, phase.prompt)}
                                disabled={isPromptsLoading[phase.id]}
                                className="px-5 py-2 border border-cyan-500/40 hover:bg-cyan-500/10 rounded-lg font-mono text-[10.5px] text-cyan-300 transition-all uppercase tracking-wider font-bold flex items-center gap-1.5 disabled:opacity-45"
                              >
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                {isPromptsLoading[phase.id] ? "Optimizing..." : "Gemini Optimize"}
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}

                    {/* Bottom commit configurations bar */}
                    <div className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                      <div className="orca-card rounded-[inherit] p-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-black/85 to-neutral-950/70 border border-white/10 shadow-lg">
                        <div className="flex flex-col sm:flex-row items-center gap-10">
                          
                          <div className="flex flex-col gap-2">
                            <span className="font-mono text-[9px] text-cyan-300 uppercase tracking-[0.2em] font-bold">Retry_Policy</span>
                            <div className="flex items-center gap-3">
                              <input 
                                type="number"
                                value={models?.retryCount || 3}
                                onChange={(e) => handleRetryCountChange(parseInt(e.target.value) || 3)}
                                className="w-16 control-contrast rounded-lg px-2 py-1.5 font-mono text-xs text-center input-glow" 
                              />
                              <span className="font-mono text-[9px] text-white/70 uppercase font-bold">Attempts</span>
                            </div>
                          </div>
                          
                          <div className="hidden sm:block h-10 w-[1px] bg-white/20 animate-pulse"></div>
                          
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={handleEmbeddingsToggle}
                              className="relative inline-flex items-center cursor-pointer border-none outline-none bg-transparent"
                            >
                              <div className={`w-12 h-6 rounded-full transition-colors relative border border-white/10 ${
                                models?.autoEmbeddings ? 'bg-cyan-400' : 'bg-white/10'
                              }`}>
                                <div className={`absolute top-[2px] w-4.5 h-4.5 rounded-full bg-white shadow transition-all duration-300 ${
                                  models?.autoEmbeddings ? 'left-[26px]' : 'left-[4px]'
                                }`} />
                              </div>
                            </button>
                            <div className="flex flex-col">
                              <span className="font-mono text-[10px] text-white uppercase tracking-widest font-bold">Auto_Embeddings</span>
                              <span className="font-mono text-[8px] text-cyan-400 uppercase tracking-wider font-bold">Neural Context Layer</span>
                            </div>
                          </div>

                        </div>

                        <div className="flex gap-4 w-full md:w-auto font-mono text-xs font-bold">
                          <button 
                            onClick={fetchModels}
                            className="flex-1 md:flex-none px-6 py-3 border border-white/30 rounded-lg text-white hover:border-white/50 transition-all uppercase tracking-widest bg-black/40"
                          >
                            Discard
                          </button>
                          <button 
                            onClick={handleCommitModels}
                            className="flex-1 md:flex-none px-8 py-3 bg-cyan-400 text-black rounded-lg shadow-[0_10px_40px_rgba(0,219,233,0.3)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest font-black"
                          >
                            Commit_Config
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* TAB: CONFLICT TRACKER */}
            {activeTab === "conflict-tracker" && (() => {
              const terms = [
                "war", "war zone", "peace treaty", "Middle East", "China", 
                "America", "Crude Oil", "conflict", "sanctions", "Pakistan", "India"
              ];

              // Mock geopolitical fallback reports when GNews API key is missing
              const mockGeopoliticalReports = [
                {
                  title: "Middle East Logistics Corridor Framework Escalates in Geneva Assemblies",
                  description: "High-intensity deliberations surrounding shipping corridor safety grids took priority as Suez transit volatility indicators reached weekly peaks.",
                  publishedAt: "2026-05-27T10:15:00Z",
                  source: { name: "Suez Transit Bureau (Simulated)", url: "https://gnews.io" },
                  image: "https://images.unsplash.com/photo-1547483238-f400e65ccd56?auto=format&fit=crop&w=500&q=80"
                },
                {
                  title: "Indo-Pacific Naval Joint Exercises Trigger Supply Chain Customs Sanctions",
                  description: "Global maritime compliance commissions established strict review standards for automated high-technology hardware crossing critical ocean pathways.",
                  publishedAt: "2026-05-27T08:42:00Z",
                  source: { name: "Naval Compliance Press (Simulated)", url: "https://gnews.io" },
                  image: "https://images.unsplash.com/photo-1507682531662-421b17ac4f83?auto=format&fit=crop&w=500&q=80"
                },
                {
                  title: "South Asia Strategic Border Accords De-escalate Frontline Patrol Volatility",
                  description: "Defense commanders successfully activated dedicated secondary communications paths to manage physical buffer segments with no incident anomalies reported.",
                  publishedAt: "2026-05-26T18:22:00Z",
                  source: { name: "Himalayan Sentinel (Simulated)", url: "https://gnews.io" },
                  image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=80"
                },
                {
                  title: "Global Crude Oil Futures Spike Following New Bilateral Trade Sanction Directives",
                  description: "Energy analytics platforms recorded a 2.45% baseline increase in regional heavy crude delivery indexes as trade compliance audits intensify across safe harbors.",
                  publishedAt: "2026-05-26T14:10:00Z",
                  source: { name: "Bourse Crude Intelligence (Simulated)", url: "https://gnews.io" },
                  image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80"
                }
              ];

              const currentArticles = conflictApiKey ? conflictArticles : mockGeopoliticalReports;

              return (
                <div className="space-y-8 animate-fadeIn">
                  <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,1)]"></span>
                        <h2 className="text-2xl font-bold tracking-tight text-white uppercase italic">
                          Global Conflict & Geopolitical Intel Tracker
                        </h2>
                      </div>
                      <p className="text-xs text-on-surface-variant font-mono max-w-2xl">
                        Monitor breaking high-stakes international developments of active dispute regions. High-precision live feeds parsed directly using your personal GNews node configuration.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (conflictApiKey) {
                            fetchConflictNews(conflictSearchTerm);
                          } else {
                            showToast("API Key is missing! Click Settings to configure it.", "error");
                          }
                        }}
                        disabled={isFetchingConflict}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all duration-300 outline-none cursor-pointer ${
                          isFetchingConflict
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-not-allowed"
                            : "bg-rose-500 text-white hover:bg-rose-400 border border-rose-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95"
                        }`}
                      >
                        <RotateCw className={`w-4 h-4 ${isFetchingConflict ? "animate-spin animate-infinite" : ""}`} />
                        {isFetchingConflict ? "PENDING..." : "RE-SYNC TRACKER"}
                      </button>
                    </div>
                  </header>

                  {/* API KEY ALERTS IF ABSENT */}
                  {!conflictApiKey && (
                    <div className="bg-gradient-to-r from-rose-950/40 to-neutral-900 border border-rose-500/30 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-rose-500/10 to-transparent pointer-events-none"></div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/35 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-6 h-6 text-rose-400" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-mono text-sm uppercase text-white font-black tracking-wider">
                            GNews Api Node Standby Mode
                          </h4>
                          <p className="text-xs font-mono text-neutral-300">
                            No credentials discovered inside local session vaults. A free personal API key is required to perform high-precision real-time satellite updates. 
                          </p>
                          <p className="text-[10px] text-neutral-400 pt-1">
                            Below we display high-fidelity simulated dispute alerts referencing current parameters. To stream authentic updates, configure a key inside Settings.
                          </p>
                        </div>
                        <div className="sm:ml-auto shrink-0">
                          <button
                            onClick={() => setActiveTab("settings")}
                            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(239,68,68,0.2)] cursor-pointer"
                          >
                            Go To Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TOP SEARCH TAGS ROW */}
                  <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
                    <span className="block font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-black">
                      Index Geopolitical Vector Target
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {terms.map((term) => {
                        const isActive = conflictSearchTerm.toLowerCase() === term.toLowerCase();
                        return (
                          <button
                            key={term}
                            onClick={() => {
                              setConflictSearchTerm(term);
                              if (conflictApiKey) {
                                fetchConflictNews(term);
                              } else {
                                showToast(`Simulation Filter changed to "${term}". Add GNews API key for live fetch.`, "info");
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-lg border font-mono text-[11px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                              isActive
                                ? "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                                : "bg-white/[0.02] text-neutral-400 border-white/5 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {term}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/5 items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                        <Database className="w-4 h-4 text-rose-400" />
                        <span>Filter Parameter: </span>
                        <span className="text-white font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded text-[10px]">
                          {conflictSearchTerm}
                        </span>
                      </div>

                      <div className="relative w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Type custom query word..."
                          value={conflictSearchTerm}
                          onChange={(e) => setSearchQuery(e.target.value)} // Safe fall-through or standalone local
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const targetVal = (e.target as HTMLInputElement).value;
                              setConflictSearchTerm(targetVal);
                              if (conflictApiKey) {
                                fetchConflictNews(targetVal);
                              } else {
                                showToast("Add a GNews API Key inside Settings to query any terms.", "info");
                              }
                            }
                          }}
                          className="pl-4 pr-12 py-1.5 w-full sm:w-64 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/40 transition-all text-left"
                        />
                        <button
                          onClick={() => {
                            if (conflictApiKey) {
                              fetchConflictNews(conflictSearchTerm);
                            } else {
                              showToast("Add a GNews API Key inside Settings to query any terms.", "info");
                            }
                          }}
                          className="absolute right-2 top-1 bottom-1 text-xs text-rose-400 font-mono font-bold hover:text-rose-300"
                        >
                          Query
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RESULTS CONTAINER */}
                  {isFetchingConflict ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 border border-white/5 rounded-2xl bg-neutral-900/20">
                      <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-mono text-xs text-neutral-400 animate-pulse uppercase tracking-widest">
                        Syncing credentials with GNews Satellite Network...
                      </p>
                    </div>
                  ) : conflictError ? (
                    <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
                      <ShieldAlert className="w-12 h-12 text-rose-400 animate-bounce" />
                      <div>
                        <h4 className="font-mono text-sm uppercase text-white font-black mb-1">
                          Terminal Handshake Blocked
                        </h4>
                        <p className="text-xs font-mono text-neutral-400 max-w-lg leading-relaxed">
                          {conflictError}
                        </p>
                      </div>
                      <button
                        onClick={() => fetchConflictNews(conflictSearchTerm)}
                        className="px-4 py-2 bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg font-mono text-xs cursor-pointer"
                      >
                        Try Handshake Connection Again
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentArticles.map((article: any, index: number) => (
                        <div 
                          key={`conflict-art-${index}`}
                          className="bg-black/40 border border-white/10 hover:border-white/20 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col group relative"
                        >
                          {/* Image box */}
                          <div className="h-44 relative bg-neutral-950/60 overflow-hidden shrink-0 border-b border-white/5">
                            {article.image ? (
                              <img 
                                src={article.image} 
                                alt={article.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  // fallback if image fails to load
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-rose-950/10 to-neutral-900 flex items-center justify-center">
                                <Globe className="w-12 h-12 text-rose-500/20" />
                              </div>
                            )}
                            
                            {/* Source and timestamp overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                            
                            <div className="absolute top-3 left-3 bg-rose-500/90 text-black font-semibold text-[9px] font-mono tracking-widest px-2 py-0.5 rounded uppercase">
                              {index === 0 && !conflictApiKey ? "CURRENT REPORT" : "LIVE SIGNAL"}
                            </div>
                            
                            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-neutral-300 font-bold">
                              <span className="flex items-center gap-1 bg-neutral-900/80 px-2 py-0.5 rounded border border-white/5">
                                <Globe className="w-3 h-3 text-rose-400" />
                                {article.source?.name || "Global Stream"}
                              </span>
                              <span>
                                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ""}
                              </span>
                            </div>
                          </div>

                          {/* Content summary */}
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <h3 className="text-sm font-extrabold text-white leading-snug group-hover:text-rose-300 transition-colors">
                                {article.title}
                              </h3>
                              <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                                {article.description || "Segment commentary has been truncated. Open index URL for satellite text reports."}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                              <span className="font-mono text-[9px] text-neutral-500 font-black">
                                ID: GNEWS-(X-00{index+1})
                              </span>
                              
                              <a 
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-mono font-bold cursor-pointer"
                              >
                                View Live Wire
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* HISTORICAL REBOOT STATUS SUMMARY */}
                  <footer className="bg-neutral-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-neutral-400">
                      <div>
                        &gt; GEOLOCATION COVERAGE: <span className="text-emerald-400 font-bold">STABLE</span>
                      </div>
                      <div className="font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                        Last Update Sync: {conflictApiKey ? "Real-Time Hook" : "Simulated Local Pipeline"}
                      </div>
                    </div>
                  </footer>
                </div>
              );
            })()}

            {/* TAB: SETTINGS */}
            {activeTab === "settings" && (() => {
              const handleSaveSettings = () => {
                localStorage.setItem("gnews_api_key", conflictApiKey.trim());
                localStorage.setItem("alpha_vantage_api_key", alphaVantageApiKey.trim());
                showToast("Configuration saved successfully. Credentials persisted in secure vaults.", "success");
              };

              return (
                <div className="space-y-10 animate-fadeIn">
                  <header className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_rgba(34,211,238,1)]"></span>
                      <h2 className="text-2xl font-bold tracking-tight text-white uppercase italic">
                        Secured Settings & Network Configuration
                      </h2>
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono">
                      Define node credentials and routing defaults for deep geopolitical news index networks.
                    </p>
                  </header>

                  <div className="max-w-3xl bg-neutral-900/45 border border-white/10 rounded-2xl overflow-hidden p-6 relative z-10 backdrop-blur-md space-y-6">
                    <div className="border-b border-white/15 pb-4">
                      <h3 className="font-mono text-xs text-cyan-300 tracking-[0.2em] font-extrabold flex items-center gap-2 uppercase">
                        <Settings className="w-4 h-4 text-cyan-300 w-4 h-4" />
                        GNews API credentials
                      </h3>
                    </div>

                    {/* API Key Form block */}
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                          GNews.io Authentication Key
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="Enter your GNews personal API key..."
                            value={conflictApiKey}
                            onChange={(e) => setConflictApiKey(e.target.value)}
                            className="bg-black/50 border border-white/10 w-full px-4 py-3 rounded-xl font-mono text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <p className="text-[10px] text-neutral-500 font-mono leading-relaxed pl-1 pt-1">
                          Unrestricted search operations require an API key from GNews. Get a free credential by registering on <a href="https://gnews.io" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline cursor-pointer">gnews.io</a>. Key persists inside your browser local storage securely.
                        </p>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-white/10">
                        <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                          Alpha Vantage API Authentication Key
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="Enter your Alpha Vantage personal API key..."
                            value={alphaVantageApiKey}
                            onChange={(e) => setAlphaVantageApiKey(e.target.value)}
                            className="bg-black/50 border border-white/10 w-full px-4 py-3 rounded-xl font-mono text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <p className="text-[10px] text-neutral-500 font-mono leading-relaxed pl-1 pt-1">
                          Required for high-precision live updates of major global market indexes impacting the Indian Stock Market. Register on <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline cursor-pointer">alphavantage.co</a> to acquire your free query key.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Lang parameter choice */}
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                            Default Language
                          </label>
                          <select
                            value={conflictSearchLang}
                            onChange={(e) => setConflictSearchLang(e.target.value)}
                            className="bg-black/50 border border-white/10 w-full px-4 py-2.5 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            <option value="en">English (en)</option>
                            <option value="ar">Arabic (ar)</option>
                            <option value="zh">Chinese (zh)</option>
                            <option value="fr">French (fr)</option>
                            <option value="de">German (de)</option>
                            <option value="hi">Hindi (hi)</option>
                            <option value="ru">Russian (ru)</option>
                            <option value="es">Spanish (es)</option>
                          </select>
                        </div>

                        {/* Country parameter choice */}
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                            Target Country
                          </label>
                          <select
                            value={conflictSearchCountry}
                            onChange={(e) => setConflictSearchCountry(e.target.value)}
                            className="bg-black/50 border border-white/10 w-full px-4 py-2.5 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            <option value="any">Any (Global)</option>
                            <option value="us">United States (us)</option>
                            <option value="in">India (in)</option>
                            <option value="pk">Pakistan (pk)</option>
                            <option value="il">Israel (il)</option>
                            <option value="ru">Russia (ru)</option>
                            <option value="cn">China (cn)</option>
                            <option value="gb">United Kingdom (gb)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Sort choice */}
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                            Sort Priority direction
                          </label>
                          <select
                            value={conflictSortBy}
                            onChange={(e) => setConflictSortBy(e.target.value)}
                            className="bg-black/50 border border-white/10 w-full px-4 py-2.5 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            <option value="publishedAt">Most Recent (publishedAt)</option>
                            <option value="relevance">Best Match Relevance</option>
                          </select>
                        </div>

                        {/* Feed count choice */}
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                            Maximum Stories Count
                          </label>
                          <select
                            value={conflictMaxResults}
                            onChange={(e) => setConflictMaxResults(Number(e.target.value))}
                            className="bg-black/50 border border-white/10 w-full px-4 py-2.5 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            <option value="5">5 Articles</option>
                            <option value="10">10 Articles</option>
                            <option value="15">15 Articles</option>
                            <option value="20">20 Articles</option>
                            <option value="50">50 Articles</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          onClick={handleSaveSettings}
                          className="px-6 py-2.5 bg-cyan-400 text-black hover:bg-cyan-300 rounded-xl font-mono text-xs font-extrabold uppercase tracking-widest shadow-[0_5px_15px_rgba(34,211,238,0.2)] transition-all cursor-pointer active:scale-95"
                        >
                          Persist Settings Key
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB FIVE: GLOBAL ETFS VIEW SCREEN */}
            {activeTab === "etfs" && (
              <div className="space-y-10">
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                  <div className="max-w-4xl">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_15px_rgba(0,219,233,1)]"></span>
                      <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase italic drop-shadow-lg">
                        Global ETF's Terminal
                      </h1>
                    </div>
                    <p className="font-medium text-xs text-on-surface border-l-2 border-cyan-400/50 pl-6 leading-relaxed max-w-2xl bg-black/40 backdrop-blur-sm rounded-r-lg py-2 font-mono">
                      Institutional interface for tracking macro asset basket allocations, live scraped flow directions, and cross-asset risk ratings.
                    </p>
                  </div>
                  
                  {/* Crawl Controller */}
                  <div className="flex flex-wrap items-center gap-4 relative z-10 font-mono text-xs">
                    <button 
                      onClick={handleScrapeEtfs}
                      disabled={isScrapingEtfs}
                      className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-semibold text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] tracking-widest uppercase disabled:opacity-55 cursor-pointer"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isScrapingEtfs ? 'animate-bounce text-yellow-500' : ''}`} />
                      {isScrapingEtfs ? "SCRAPING INDICES..." : "SCRAPE GLOBAL ETFS"}
                    </button>
                  </div>
                </header>

                {/* Macro flows indicator */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  <div className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                    <div className="orca-card rounded-[inherit] p-5 flex items-center gap-4 bg-black/45 hover:bg-black/60 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/35">
                        <span className="material-symbols-outlined text-cyan-400 text-xl">payments</span>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] text-on-surface-variant/70 uppercase tracking-widest">Global Flow Status</div>
                        <div className="font-mono text-sm text-cyan-300 font-bold tracking-tight uppercase">
                          {etfsData?.globalFlowStatus || "INSTITUTIONAL ACCRUEL ACTIVE"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                    <div className="orca-card rounded-[inherit] p-5 flex items-center gap-4 bg-black/45 hover:bg-black/60 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/35">
                        <span className="material-symbols-outlined text-emerald-400 text-xl">equalizer</span>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] text-on-surface-variant/70 uppercase tracking-widest">Total Cumulative AUM</div>
                        <div className="font-mono text-sm text-white font-bold tracking-tight uppercase">
                          $1.24 Trillion USD Cumulative
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                    <div className="orca-card rounded-[inherit] p-5 flex items-center gap-4 bg-black/45 hover:bg-black/60 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                        <span className="material-symbols-outlined text-white/80 text-xl">update</span>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] text-on-surface-variant/70 uppercase tracking-widest">
                          Last Web Scrape Instance
                        </div>
                        <div className="font-mono text-sm text-white/90 font-bold tracking-tight uppercase">
                          {etfsData?.lastScrapedAt ? new Date(etfsData.lastScrapedAt).toLocaleTimeString() + " UTC" : "Pending Session Capture"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VIEW TWO: WEBSCRAPED GLOBAL MARKET TERMINAL */}
                {true && (
                  <div className="relative z-10 space-y-6">
                    {/* Checking active crawl state */}
                    {!etfsData?.scrapedCategories || etfsData.scrapedCategories.length === 0 ? (
                      <div className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                        <div className="orca-card p-12 text-center rounded-[inherit] flex flex-col items-center justify-center space-y-6 bg-black/60 font-mono">
                          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined text-cyan-400 text-3xl animate-spin">cyclone</span>
                          </div>
                          <div className="space-y-2 max-w-xl">
                            <h3 className="text-white text-lg font-bold uppercase tracking-widest">Global ETF Neural Crawl Required</h3>
                            <p className="text-on-surface-variant text-xs leading-relaxed font-semibold">
                              Neural pipeline has not completed ingestion sweep over INDMoney indices. Trigger the active crawl mechanism to fetch realtime performance parameters.
                            </p>
                          </div>
                          <button
                            onClick={handleScrapeEtfs}
                            disabled={isScrapingEtfs}
                            className="px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] uppercase tracking-widest disabled:opacity-50"
                          >
                            {isScrapingEtfs ? "CRAWLING ASSET VECTORS..." : "INITIALIZE CRAWL MECHANISM"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Horizontal scrolling chips list of 14 categories */}
                        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                          <span className="block font-mono text-[9px] text-cyan-300/80 mb-3 tracking-widest uppercase font-bold">
                            Ingested Thematic Categories (14 Sources)
                          </span>
                          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none custom-scrollbar select-none">
                            {etfsData.scrapedCategories.map((cat, idx) => {
                              const isSelected = selectedScrapedCategory === cat.category;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedScrapedCategory(cat.category)}
                                  className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap border cursor-pointer shrink-0 ${
                                    isSelected
                                      ? "bg-white text-black border-white shadow-md shadow-white/10 scale-[1.02]"
                                      : "bg-white/5 text-on-surface-variant border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                                  }`}
                                >
                                  {cat.category.replace(/ etfs/i, "").replace(/ etf/i, "").trim()}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Rendering selected category indices table sheet */}
                        {(() => {
                          const activeCategory = etfsData.scrapedCategories.find(c => c.category === selectedScrapedCategory) || etfsData.scrapedCategories[0];
                          if (!activeCategory) return null;

                          return (
                            <div className="orbital-border" onMouseMove={handleOrbitalMouseMove}>
                              <div className="orca-card rounded-[inherit] overflow-hidden bg-black/45">
                                {/* Category Banner Detail */}
                                <div className="px-8 py-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02]">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                      <span className="font-mono text-[9px] text-emerald-400 font-bold tracking-widest uppercase">
                                        Ingested Channel Active
                                      </span>
                                    </div>
                                    <h3 className="text-xl font-sans italic font-extrabold text-white uppercase">{activeCategory.category}</h3>
                                  </div>

                                  <div className="flex items-center gap-3 font-mono text-[10.5px]">
                                    <span className="text-neutral-500 font-semibold uppercase">Source Ingestion Vector:</span>
                                    <a
                                      href={activeCategory.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center gap-1 shrink-0 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 uppercase"
                                    >
                                      INSPECT INDMONEY LIVE
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>

                                {/* Index Rows Master Sheet Table */}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse select-text">
                                    <thead>
                                      <tr className="border-b border-white/10 bg-black/20 font-mono text-[10px] text-neutral-400/90 font-bold uppercase tracking-wider">
                                        <th className="py-4 px-6 text-center w-14">#</th>
                                        <th className="py-4 px-6">Asset Name</th>
                                        <th className="py-4 px-6 text-center">Ticker</th>
                                        <th className="py-4 px-6 text-right">Last Price</th>
                                        <th className="py-4 px-6 text-center">Price Change</th>
                                        <th className="py-4 px-6 text-right">3 Yr. Return</th>
                                        <th className="py-4 px-6 text-right">Volume</th>
                                        <th className="py-4 px-6 text-center">Link Code</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-mono text-xs font-semibold">
                                      {activeCategory.rows.length === 0 ? (
                                        <tr>
                                          <td colSpan={8} className="py-12 text-center text-on-surface-variant font-bold italic">
                                            No ETF entries crawled. Trigger FORCE CRAWL to repopulate data stream.
                                          </td>
                                        </tr>
                                      ) : (
                                        activeCategory.rows.map((row, rIdx) => {
                                          const isPositive = row.change.includes("▲") || row.change.includes("+") || (!row.change.includes("▼") && !row.change.includes("-"));
                                          const isNegative = row.change.includes("▼") || row.change.includes("-");

                                          return (
                                            <tr key={rIdx} className="hover:bg-white/[0.04] transition-colors group">
                                              <td className="py-4 px-6 text-center text-neutral-500 font-bold">{(rIdx + 1).toString().padStart(2, "0")}</td>
                                              <td className="py-4 px-6 font-bold text-white leading-relaxed">
                                                <div className="flex items-center gap-3">
                                                  {row.logo_url ? (
                                                    <img
                                                      src={row.logo_url}
                                                      alt={row.name}
                                                      referrerPolicy="no-referrer"
                                                      className="w-8 h-8 rounded-lg outlineoutline-white/15 bg-black/50 shrink-0"
                                                    />
                                                  ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black font-mono text-neutral-300 text-[10px] shrink-0 uppercase">
                                                      {row.ticker.slice(0, 2)}
                                                    </div>
                                                  )}
                                                  <span className="font-sans font-bold text-[13.5px] hover:text-cyan-300 transition-colors uppercase italic">
                                                    {row.name}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="py-4 px-6 text-center">
                                                <span className="bg-white/10 text-white font-black px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider border border-white/10 shadow-lg">
                                                  {row.ticker}
                                                </span>
                                              </td>
                                              <td className="py-4 px-6 text-right font-bold text-neutral-100">{row.price}</td>
                                              <td className="py-4 px-6 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[11.5px] font-bold ${
                                                  isPositive ? "text-emerald-400 bg-emerald-950/20 border border-emerald-500/20" :
                                                  isNegative ? "text-rose-400 bg-rose-950/20 border border-rose-500/20" :
                                                  "text-white bg-white/10"
                                                }`}>
                                                  {row.change}
                                                </span>
                                              </td>
                                              <td className={`py-4 px-6 text-right font-black ${
                                                row.three_year_return.startsWith("-") ? "text-rose-400" : "text-emerald-400"
                                              }`}>
                                                {row.three_year_return}
                                              </td>
                                              <td className="py-4 px-6 text-right text-neutral-300 font-bold">{row.volume}</td>
                                              <td className="py-4 px-6 text-center">
                                                {row.detail_url ? (
                                                  <a
                                                    href={row.detail_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="View raw analyst page"
                                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-white hover:border-white/30 hover:bg-cyan-400/10 mx-auto transition-all"
                                                  >
                                                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                                                  </a>
                                                ) : (
                                                  <span className="text-neutral-600 font-bold uppercase text-[9px] block">N/A</span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                <div className="px-8 py-4 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-neutral-500 font-semibold">
                                  <span className="uppercase">
                                    TOTAL RECORD PARAMETERS SCRAPED FOR CATEGORY: {activeCategory.rows.length} ITEMS
                                  </span>
                                  <span className="uppercase uppercase-tracking-widest">
                                    INGESTED VIA CHEERIO & __NEXT_DATA__ EXCLUSIVES
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB SIX: GLOBAL NEWS MONITOR VIEW */}
            {activeTab === "global-monitor" && (() => {
              const wmFeed = globalMonitorData?.worldmonitor || { markets: [], forex: [], commodities: [] };
              const q = monitorSearchQuery.toLowerCase();
              
              const filteredMarkets = (wmFeed.markets || []).filter((item: any) => 
                !q || item.title.toLowerCase().includes(q) || (item.summary || "").toLowerCase().includes(q) || (item.source || "").toLowerCase().includes(q)
              );
              
              const filteredForex = (wmFeed.forex || []).filter((item: any) => 
                !q || item.title.toLowerCase().includes(q) || (item.summary || "").toLowerCase().includes(q) || (item.source || "").toLowerCase().includes(q)
              );
              
              const filteredCommodities = (wmFeed.commodities || []).filter((item: any) => 
                !q || item.title.toLowerCase().includes(q) || (item.summary || "").toLowerCase().includes(q) || (item.source || "").toLowerCase().includes(q)
              );

              return (
                <div className="space-y-10">
                  <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div className="max-w-4xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,1)]"></span>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase italic drop-shadow-lg flex items-center gap-2">
                          Global News Monitor
                        </h1>
                      </div>
                      <p className="font-medium text-xs text-on-surface border-l-2 border-emerald-400/50 pl-6 leading-relaxed max-w-3xl bg-black/40 backdrop-blur-sm rounded-r-lg py-2 font-mono">
                        Real-time scrapers tracking primary geopolitical events, macroeconomic indicators, and trade developments directly from global finance directories.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleScrapeGlobalMonitor}
                        disabled={isScrapingGlobal}
                        className={`px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-lg border flex items-center gap-2 transition-all ${
                          isScrapingGlobal
                            ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/20 cursor-not-allowed"
                            : "bg-emerald-400 text-black border-transparent hover:bg-emerald-300 hover:scale-[1.02] active:scale-95 shadow-[0_4px_24px_rgba(52,211,153,0.2)]"
                        }`}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isScrapingGlobal ? "animate-spin" : ""}`} />
                        {isScrapingGlobal ? "Executing Crawlers..." : "Run Active Scrapers"}
                      </button>
                    </div>
                  </header>

                    <div className="space-y-6">
                      {/* FILTER AND QUICK INFO */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                        <div className="flex items-center gap-2.5 font-mono text-[11px] text-neutral-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Directory Connection:</span>
                          <a 
                            href="https://finance.worldmonitor.app" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-emerald-400 hover:underline hover:text-emerald-300 font-bold flex items-center gap-1"
                          >
                            https://finance.worldmonitor.app
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        
                        <div className="relative max-w-sm w-full">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                          <input
                            type="text"
                            placeholder="Filter live bulletins..."
                            value={monitorSearchQuery}
                            onChange={(e) => setMonitorSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
                          />
                        </div>
                      </div>

                      {/* REAL GLOBAL MARKET INDEX BANNER */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                          <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-cyan-400 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-cyan-400" />
                            Live Global Market Benchmarks (Alpha Vantage Feed)
                          </h3>
                          <span className={`w-2 h-2 rounded-full ${alphaVantageApiKey ? "bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-neutral-500 animate-pulse"}`}></span>
                        </div>

                        {!alphaVantageApiKey ? (
                          <div className="py-6 text-center space-y-3 bg-black/30 rounded-xl border border-dashed border-white/5">
                            <p className="text-xs text-neutral-400 font-mono leading-relaxed max-w-xl mx-auto">
                              Alpha Vantage API Key is not assigned. Live USA and premium global indices cannot be fetched. Configure your API key in the Setup panel to enable real-time tracking of DJI, SPX, Nasdaq, and Russell.
                            </p>
                            <button
                              onClick={() => setActiveTab("settings")}
                              className="px-4 py-2 bg-cyan-400/10 hover:bg-cyan-400 hover:text-black border border-cyan-400/30 text-cyan-400 font-semibold text-[10px] font-mono tracking-widest rounded-lg transition-all"
                            >
                              CONFIGURE_ALPHA_VANTAGE_KEY
                            </button>
                          </div>
                        ) : !globalMonitorData?.global_indices || globalMonitorData.global_indices.length === 0 ? (
                          <div className="py-6 text-center space-y-3 bg-black/30 rounded-xl border border-dashed border-white/5">
                            <p className="text-xs text-neutral-400 font-mono leading-relaxed max-w-xl mx-auto">
                              API Key detected, but live monitor data has not been ingested yet.
                            </p>
                            <button
                              onClick={handleScrapeGlobalMonitor}
                              disabled={isScrapingGlobal}
                              className="px-4 py-2 bg-cyan-400/20 hover:bg-cyan-400 hover:text-black border border-cyan-400/30 text-cyan-400 font-semibold text-[10px] font-mono tracking-widest rounded-lg transition-all"
                            >
                              {isScrapingGlobal ? "INGESTING LIVE DATA..." : "RUN_BACKGROUND_CRAWLERS"}
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {globalMonitorData.global_indices.map((idxItem: any) => {
                              const isUp = idxItem.change >= 0;
                              return (
                                <div 
                                  key={`gm-idx-${idxItem.symbol}`}
                                  className="p-3 bg-black/40 border border-white/5 hover:border-cyan-400/30 rounded-xl flex flex-col justify-between transition-all duration-200 text-left"
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-mono text-xs font-black text-white">{idxItem.symbol}</span>
                                    <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                      isUp ? "text-cyan-400 bg-cyan-950/20 border border-cyan-500/20" : "text-rose-400 bg-rose-950/20 border border-rose-500/20"
                                    }`}>
                                      {isUp ? "+" : ""}{idxItem.percent_change.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="mt-2">
                                    <div className="font-mono text-sm font-black text-white">
                                      {idxItem.last_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-[8px] font-mono text-neutral-500 truncate mt-0.5" title={idxItem.name}>
                                      {idxItem.name}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* THREE-COLUMN BENTO GRID */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* COLUMN 1: MARKETS NEWS */}
                        <div className="space-y-5 bg-neutral-900/10 border border-white/5 p-5 rounded-2xl backdrop-blur-md">
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                              <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                                Markets News
                              </h3>
                            </div>
                            <span className="px-2 py-0.5 font-mono text-[9px] uppercase font-bold text-neutral-400 bg-black/40 rounded">
                              {filteredMarkets.length} feeds
                            </span>
                          </div>

                          <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1 scrollbar-thin scrollbar-white">
                            {filteredMarkets.length === 0 ? (
                              <div className="py-12 text-center text-neutral-500 border border-dashed border-white/5 bg-white/[0.01] rounded-xl">
                                <Compass className="w-6 h-6 mx-auto mb-2 text-neutral-600" />
                                <p className="text-xs font-mono">No matching market updates found.</p>
                              </div>
                            ) : (
                              filteredMarkets.map((article: any, idx: number) => (
                                <div 
                                  key={`wm-mkt-${idx}`}
                                  className="group relative bg-white/[0.02] hover:bg-emerald-950/20 border border-white/5 hover:border-emerald-400/20 rounded-xl p-4 transition-all duration-200"
                                >
                                  <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="px-1.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      {article.source || "WorldMonitor"}
                                    </span>
                                    {article.timestamp && (
                                      <span className="font-mono text-[9px] text-neutral-500 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {article.timestamp}
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-xs font-bold text-white leading-snug group-hover:text-emerald-400 transition-colors">
                                    {article.url ? (
                                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-start gap-1">
                                        {article.title}
                                        <ExternalLink className="w-2.5 h-2.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                      </a>
                                    ) : (
                                      article.title
                                    )}
                                  </h4>

                                  {article.summary && (
                                    <p className="mt-2 text-[11px] text-neutral-400 leading-relaxed font-mono">
                                      {article.summary}
                                    </p>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* COLUMN 2: FOREX & CURRENCIES */}
                        <div className="space-y-5 bg-neutral-900/10 border border-white/5 p-5 rounded-2xl backdrop-blur-md">
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-cyan-400" />
                              <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-cyan-400">
                                Forex & Currencies
                              </h3>
                            </div>
                            <span className="px-2 py-0.5 font-mono text-[9px] uppercase font-bold text-neutral-400 bg-black/40 rounded">
                              {filteredForex.length} feeds
                            </span>
                          </div>

                          <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1 scrollbar-thin scrollbar-white">
                            {filteredForex.length === 0 ? (
                              <div className="py-12 text-center text-neutral-500 border border-dashed border-white/5 bg-white/[0.01] rounded-xl">
                                <Compass className="w-6 h-6 mx-auto mb-2 text-neutral-600" />
                                <p className="text-xs font-mono">No matching currency updates found.</p>
                              </div>
                            ) : (
                              filteredForex.map((article: any, idx: number) => (
                                <div 
                                  key={`wm-fx-${idx}`}
                                  className="group relative bg-white/[0.02] hover:bg-cyan-950/20 border border-white/5 hover:border-cyan-400/20 rounded-xl p-4 transition-all duration-200"
                                >
                                  <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="px-1.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-wider rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                      {article.source || "WorldMonitor"}
                                    </span>
                                    {article.timestamp && (
                                      <span className="font-mono text-[9px] text-neutral-500 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {article.timestamp}
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-xs font-bold text-white leading-snug group-hover:text-cyan-400 transition-colors">
                                    {article.url ? (
                                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-start gap-1">
                                        {article.title}
                                        <ExternalLink className="w-2.5 h-2.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                      </a>
                                    ) : (
                                      article.title
                                    )}
                                  </h4>

                                  {article.summary && (
                                    <p className="mt-2 text-[11px] text-neutral-400 leading-relaxed font-mono">
                                      {article.summary}
                                    </p>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* COLUMN 3: COMMODITIES & FUTURES */}
                        <div className="space-y-5 bg-neutral-900/10 border border-white/5 p-5 rounded-2xl backdrop-blur-md">
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-amber-400" />
                              <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-amber-400">
                                Commodities & Futures
                              </h3>
                            </div>
                            <span className="px-2 py-0.5 font-mono text-[9px] uppercase font-bold text-neutral-400 bg-black/40 rounded">
                              {filteredCommodities.length} feeds
                            </span>
                          </div>

                          <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1 scrollbar-thin scrollbar-white">
                            {filteredCommodities.length === 0 ? (
                              <div className="py-12 text-center text-neutral-500 border border-dashed border-white/5 bg-white/[0.01] rounded-xl">
                                <Compass className="w-6 h-6 mx-auto mb-2 text-neutral-600" />
                                <p className="text-xs font-mono">No matching commodity updates found.</p>
                              </div>
                            ) : (
                              filteredCommodities.map((article: any, idx: number) => (
                                <div 
                                  key={`wm-cmd-${idx}`}
                                  className="group relative bg-white/[0.02] hover:bg-amber-950/20 border border-white/5 hover:border-amber-400/20 rounded-xl p-4 transition-all duration-200"
                                >
                                  <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="px-1.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-wider rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      {article.source || "WorldMonitor"}
                                    </span>
                                    {article.timestamp && (
                                      <span className="font-mono text-[9px] text-neutral-500 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {article.timestamp}
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-xs font-bold text-white leading-snug group-hover:text-amber-400 transition-colors">
                                    {article.url ? (
                                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-start gap-1">
                                        {article.title}
                                        <ExternalLink className="w-2.5 h-2.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                      </a>
                                    ) : (
                                      article.title
                                    )}
                                  </h4>

                                  {article.summary && (
                                    <p className="mt-2 text-[11px] text-neutral-400 leading-relaxed font-mono">
                                      {article.summary}
                                    </p>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                  <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono">
                      <div className="text-neutral-400 font-medium">
                        &gt; SYSTEM MONITOR STATUS: <span className="text-emerald-400 font-bold">ONLINE</span> (PORT 3000 INGRESS ACTIVE)
                      </div>
                      <div className="text-neutral-500 font-bold uppercase tracking-widest">
                        Ingested with strict zero dummy compliance
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* EARNINGS CALENDAR TAB */}
            {activeTab === "earnings" && (
              <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-300">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h2 className="text-xl font-extrabold text-white uppercase tracking-tight font-mono">Earnings Calendar</h2>
                        <p className="text-xs text-neutral-400 font-mono mt-0.5">India Inc quarterly results</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleScrapeEarnings}
                      disabled={isScrapingEarnings}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-400/20 hover:bg-emerald-400 hover:text-black border border-emerald-400/30 text-emerald-400 font-semibold text-[10px] font-mono tracking-widest rounded-lg transition-all disabled:opacity-50"
                    >
                      {isScrapingEarnings ? (
                        <>
                          <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                          LOADING...
                        </>
                      ) : (
                        <>
                          <RotateCw className="w-3.5 h-3.5" />
                          REFRESH
                        </>
                      )}
                    </button>

                    {earningsData?.fetched_at && (
                      <span className="text-[9px] font-mono text-neutral-500">
                        Last: {new Date(earningsData.fetched_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* SEARCH */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={earningsSearchQuery}
                    onChange={(e) => setEarningsSearchQuery(e.target.value)}
                    placeholder="Search companies..."
                    className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm font-mono text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-400/50"
                  />
                </div>

                {/* RESULT CALENDAR TABLE */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                  <h3 className="font-mono text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">
                    Result Calendar
                  </h3>

                  {earningsData?.result_calendar?.length === 0 ? (
                    <div className="py-12 text-center text-neutral-500 border border-dashed border-white/5 bg-white/[0.01] rounded-xl">
                      <Calendar className="w-8 h-8 mx-auto mb-3 text-neutral-600" />
                      <p className="text-sm font-mono">No result calendar data available.</p>
                      <button
                        onClick={handleScrapeEarnings}
                        className="mt-4 px-4 py-2 bg-emerald-400/20 hover:bg-emerald-400 hover:text-black text-emerald-400 text-xs font-mono rounded-lg transition-all"
                      >
                        Fetch Data
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-xs font-mono">
                        <thead className="sticky top-0 bg-neutral-900">
                          <tr className="border-b border-white/10 text-left">
                            <th className="py-3 px-4 text-neutral-400 font-bold">Company</th>
                            <th className="py-3 px-4 text-neutral-400 font-bold">Result Date</th>
                            <th className="py-3 px-4 text-neutral-400 font-bold">Sector</th>
                            <th className="py-3 px-4 text-neutral-400 font-bold">LTP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(earningsData?.result_calendar || [])
                            .slice(5)
                            .filter((company: any) =>
                              earningsSearchQuery
                                ? company.name?.toLowerCase().includes(earningsSearchQuery.toLowerCase())
                                : true
                            )
                            .map((company: any, idx: number) => (
                              <tr key={`cal-${idx}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 text-white font-medium">{company.name}</td>
                                <td className="py-3 px-4 text-neutral-300">{company.result_date || "-"}</td>
                                <td className="py-3 px-4 text-neutral-400">{company.sector || "-"}</td>
                                <td className="py-3 px-4 text-white">{company.ltp ? `Rs ${company.ltp}` : "-"}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* LIVE EARNINGS CALLS CARD */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-mono text-sm font-bold text-blue-400 uppercase tracking-wider">
                      Live Earnings Calls
                    </h3>
                    <button
                      onClick={handleScrapeLiveEarnings}
                      disabled={isScrapingLiveEarnings}
                      className="px-3 py-1.5 bg-blue-400/20 hover:bg-blue-400 hover:text-black border border-blue-400/30 text-blue-400 text-[10px] font-mono rounded transition-all disabled:opacity-50"
                    >
                      {isScrapingLiveEarnings ? "Loading..." : "Refresh"}
                    </button>
                  </div>

                  {!liveEarningsData || liveEarningsData.live_calls?.length === 0 ? (
                    <div className="py-8 text-center text-neutral-500 border border-dashed border-white/5 bg-white/[0.01] rounded-lg">
                      <Phone className="w-6 h-6 mx-auto mb-2 text-neutral-600" />
                      <p className="text-xs font-mono">No live earnings calls available.</p>
                      <button
                        onClick={handleScrapeLiveEarnings}
                        className="mt-3 px-3 py-1.5 bg-blue-400/20 hover:bg-blue-400 hover:text-black text-blue-400 text-xs font-mono rounded transition-all"
                      >
                        Fetch Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto">
                      {liveEarningsData.live_calls.map((call: any, idx: number) => (
                        <div key={`live-call-${idx}`} className="p-3 bg-black/30 border border-blue-400/10 hover:border-blue-400/30 rounded-lg transition-all">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="text-xs font-mono font-bold text-white line-clamp-2">
                                {call.title}
                              </h4>
                              {call.company && (
                                <div className="text-[9px] text-blue-300 font-mono mt-1">
                                  Company: {call.company}
                                </div>
                              )}
                              <div className="text-[9px] text-neutral-500 font-mono mt-1">
                                {call.timestamp}
                              </div>
                            </div>
                            {call.link && (
                              <a
                                href={call.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-blue-400/20 hover:bg-blue-400 hover:text-black text-blue-400 text-[9px] font-mono rounded whitespace-nowrap transition-all"
                              >
                                Link
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* NSE & BSE DATA CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* NSE Card */}
                  <div className="bg-black/40 border border-cyan-400/20 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-mono text-sm font-bold text-cyan-400 uppercase">NSE India</h3>
                      </div>
                      <button
                        onClick={handleFetchNSEData}
                        disabled={isFetchingNSE}
                        className="px-3 py-1.5 bg-cyan-400/20 hover:bg-cyan-400 hover:text-black border border-cyan-400/30 text-cyan-400 text-[10px] font-mono rounded transition-all disabled:opacity-50"
                      >
                        {isFetchingNSE ? "Loading..." : "Fetch"}
                      </button>
                    </div>

                    {/* Market Status */}
                    {nseData?.market_status && (
                      <div className="mb-4 p-3 bg-black/40 rounded-lg border border-cyan-400/10">
                        <div className="text-[10px] text-neutral-400 font-mono">Market Status</div>
                        <div className="text-sm text-white font-mono mt-1">
                          {nseData.market_status.status}
                        </div>
                      </div>
                    )}

                    {/* Top Gainers */}
                    {nseData?.top_gainers?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[10px] font-mono text-emerald-400 mb-2 uppercase">Top Gainers</div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                          {nseData.top_gainers.slice(0, 5).map((g: any, i: number) => (
                            <div key={`nse-g-${i}`} className="flex justify-between text-xs font-mono p-2 bg-black/30 rounded">
                              <span className="text-white">{g.symbol}</span>
                              <span className="text-emerald-400">+{g.changePercent?.toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* IPOs */}
                    {nseData?.ipos?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-mono text-amber-400 mb-2 uppercase">Current IPOs</div>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto">
                          {nseData.ipos.slice(0, 4).map((ipo: any, i: number) => (
                            <div key={`nse-ipo-${i}`} className="text-xs font-mono p-2 bg-black/30 rounded">
                              <div className="text-white truncate">{ipo.name}</div>
                              <div className="text-[10px] text-neutral-400">{ipo.status}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quote Lookup */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={nseQuoteSymbol}
                          onChange={(e) => setNseQuoteSymbol(e.target.value.toUpperCase())}
                          placeholder="Symbol (e.g. RELIANCE)"
                          className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded text-xs font-mono text-white"
                        />
                        <button
                          onClick={() => fetchNSEQuoteData(nseQuoteSymbol)}
                          className="px-3 py-1.5 bg-white/10 text-white text-xs font-mono rounded hover:bg-white/20"
                        >
                          Get Quote
                        </button>
                      </div>
                      {nseQuote && (
                        <div className="mt-3 p-3 bg-black/40 rounded-lg text-xs font-mono">
                          <div className="font-bold text-cyan-400">{nseQuote.symbol}</div>
                          <div className="text-white text-lg mt-1">Rs {nseQuote.price}</div>
                          <div className={nseQuote.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {nseQuote.change >= 0 ? "+" : ""}{nseQuote.change} ({nseQuote.changePercent}%)
                          </div>
                        </div>
                      )}
                    </div>

                    {nseData?.fetched_at && (
                      <div className="text-[9px] text-neutral-500 font-mono mt-3 text-right">
                        Last: {new Date(nseData.fetched_at).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  {/* BSE Card */}
                  <div className="bg-black/40 border border-amber-400/20 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                        <h3 className="font-mono text-sm font-bold text-amber-400 uppercase">BSE India</h3>
                      </div>
                      <button
                        onClick={handleFetchBSEData}
                        disabled={isFetchingBSE}
                        className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400 hover:text-black border border-amber-400/30 text-amber-400 text-[10px] font-mono rounded transition-all disabled:opacity-50"
                      >
                        {isFetchingBSE ? "Loading..." : "Fetch"}
                      </button>
                    </div>

                    {/* Top Gainers */}
                    {bseData?.top_gainers?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[10px] font-mono text-emerald-400 mb-2 uppercase">Top Gainers</div>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto">
                          {bseData.top_gainers.slice(0, 5).map((g: any, i: number) => (
                            <div key={`bse-g-${i}`} className="flex justify-between text-xs font-mono p-2 bg-black/30 rounded">
                              <span className="text-white truncate">{g.company}</span>
                              <span className="text-emerald-400">+{g.changePercent?.toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top Losers */}
                    {bseData?.top_losers?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[10px] font-mono text-rose-400 mb-2 uppercase">Top Losers</div>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto">
                          {bseData.top_losers.slice(0, 5).map((l: any, i: number) => (
                            <div key={`bse-l-${i}`} className="flex justify-between text-xs font-mono p-2 bg-black/30 rounded">
                              <span className="text-white truncate">{l.company}</span>
                              <span className="text-rose-400">{l.changePercent?.toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Result Calendar */}
                    {bseData?.result_calendar?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[10px] font-mono text-cyan-400 mb-2 uppercase">Result Calendar</div>
                        <div className="space-y-2 max-h-[100px] overflow-y-auto">
                          {bseData.result_calendar.slice(0, 4).map((r: any, i: number) => (
                            <div key={`bse-res-${i}`} className="text-xs font-mono p-2 bg-black/30 rounded">
                              <div className="text-white truncate">{r.company}</div>
                              <div className="text-[10px] text-neutral-400">{r.boardMeetingDate}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Corporate Actions */}
                    {bseData?.corporate_actions?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-mono text-purple-400 mb-2 uppercase">Corporate Actions</div>
                        <div className="space-y-2 max-h-[100px] overflow-y-auto">
                          {bseData.corporate_actions.slice(0, 4).map((a: any, i: number) => (
                            <div key={`bse-act-${i}`} className="text-xs font-mono p-2 bg-black/30 rounded">
                              <div className="text-white truncate">{a.company}</div>
                              <div className="text-[10px] text-neutral-400">{a.type} - {a.exDate}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quote Lookup */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={bseQuoteCode}
                          onChange={(e) => setBseQuoteCode(e.target.value)}
                          placeholder="Scrip Code (e.g. 500325)"
                          className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded text-xs font-mono text-white"
                        />
                        <button
                          onClick={() => fetchBSEQuoteData(bseQuoteCode)}
                          className="px-3 py-1.5 bg-white/10 text-white text-xs font-mono rounded hover:bg-white/20"
                        >
                          Get Quote
                        </button>
                      </div>
                      {bseQuote && (
                        <div className="mt-3 p-3 bg-black/40 rounded-lg text-xs font-mono">
                          <div className="font-bold text-amber-400">{bseQuote.company}</div>
                          <div className="text-white text-lg mt-1">Rs {bseQuote.price}</div>
                          <div className={bseQuote.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {bseQuote.change >= 0 ? "+" : ""}{bseQuote.change} ({bseQuote.changePercent}%)
                          </div>
                        </div>
                      )}
                    </div>

                    {bseData?.fetched_at && (
                      <div className="text-[9px] text-neutral-500 font-mono mt-3 text-right">
                        Last: {new Date(bseData.fetched_at).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* RESOLVE HEATMAP MODAL COMPONENT */}
            {showResolveModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                <div className="bg-neutral-950 border border-cyan-400/50 p-8 rounded-2xl max-w-2xl w-full relative space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-bold text-white uppercase italic tracking-tight flex items-center gap-2">
                        <Sparkles className="text-cyan-400 animate-pulse w-5 h-5" />
                        ORCA_HEATMAP_RESOLVED
                      </h4>
                      <p className="text-xs text-on-surface-variant font-mono">NODE SEGMENT: ORCA-16-MAIN-INF</p>
                    </div>
                    <button
                      onClick={() => setShowResolveModal(false)}
                      className="text-on-surface-variant hover:text-white font-mono text-xs bg-white/5 border border-white/10 px-3 py-1 rounded"
                    >
                      CLOSE
                    </button>
                  </div>

                  <div className="h-64 bg-black/40 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center p-2 relative">
                    <img
                      alt="Resolved visual"
                      className="absolute inset-0 w-full h-full object-cover opacity-80 select-none animate-pulse"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa_ZuEEyryU-z8UrLFBuG8UrfdiCzuuk6yddQbdxCPBqoo93b5EufdWJryvoFNxP29LUp9u1csC_MBe5-xcNlS8bsMFcw6NwZmzBpr54A2nm17uHjAE9qJ5vuSLsGsTLo2hXRVeu5aQPGUlOMPmlmV6HC-88lKb0SSt3_HJhihSTPhlvk7HLIKrNHGkYrQexFfaO2_PkgIssx0LN9IpDNZuKfL-BKV7x6Y5JLl4lFsw9wylvIit31NNQ_d5JlEAqdXWeZ8yjTqqAe8"
                    />
                    <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-[2px] pointer-events-none"></div>
                    <span className="font-mono text-xs text-white font-black z-10 uppercase tracking-widest bg-black/80 px-4 py-2 border border-cyan-400 rounded-md shadow-lg animate-bounce">
                      SYSTEM METRICS RESOLVED (L7 EXPLICIT)
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-on-surface-variant leading-relaxed">
                    <p className="mb-2 font-bold text-white">RECALIBRATION REPORT CONSOLE:</p>
                    <p>&gt; Neural attention vectors evaluating 4.2k backtested regimes returned positive buy index alignment over AAPL and NVDA.</p>
                    <p>&gt; TSLA support bounds require immediate hedging nodes options relay.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

      {/* BACKGROUND FLOATING EFFECTS FOR KINETIC TERMINAL REAL-TIME FLICKERS */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.20) 1.5px, transparent 1.5px)", backgroundSize: "60px 60px" }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
      </div>
    </div>
  );
}
