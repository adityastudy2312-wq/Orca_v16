export interface Ticker {
  symbol: string;
  company: string;
  sector: string;
  logo: string;
  rating: string;
  price: number;
  changeToday: number;
  rsi: number;
  ema200: string;
  ema200Details: string;
  volFlow: string;
  volFlowDetails: string;
  alphaScore: number;
  volatility?: string;
  whaleFlow?: string;
  riskText?: string;
  sentiment?: string;
  sentimentBars?: number[];
  sparkline?: number[];
}

export interface RecalibrationFilter {
  id: string;
  label: string;
  active: boolean;
  value: string;
}

export interface Recalibration {
  filters: RecalibrationFilter[];
  confidence: number;
}

export interface IndexExposure {
  name: string;
  change: number;
  displayValue?: string;
}

export interface SignalsData {
  tickers: Ticker[];
  recalibration: Recalibration;
  exposures: IndexExposure[];
}

export interface NewsFeatured {
  title: string;
  source: string;
  ago: string;
  topic: string;
  image: string;
  content: string;
}

export interface NewsFeedItem {
  id: string;
  topic: string;
  tagColor: string;
  time: string;
  title: string;
  summary: string;
  source: string;
  sourceLetter: string;
  extraMetric?: {
    label: string;
    value: string;
    ticker: string;
  };
}

export interface NewsSuggested {
  type: string;
  label: string;
  text: string;
  actionLabel: string;
}

export interface NewsScrapedArticle {
  type: "Detailed" | "TitleOnly" | "AssetChange" | "PulseCompact";
  title?: string;
  url?: string;
  summary?: string;
  imageUrl?: string;
  published_at?: string;
  publisher?: string;
  article_kind?: string;
  asset?: string;
  change?: number;
}

export interface NewsScrapedSource {
  source: string;
  url: string;
  status: number;
  fetched_at: string;
  page_title: string | null;
  articles: NewsScrapedArticle[];
}

export interface NewsScrapeError {
  kind: string;
  url: string;
  message: string;
}

export interface NewsScrapedInfo {
  scraped_at: string;
  sources: NewsScrapedSource[];
  errors: NewsScrapeError[];
}

export interface NewsData {
  featured: NewsFeatured;
  feed: NewsFeedItem[];
  suggested: NewsSuggested[];
  sentimentBars: number[];
  scraped?: NewsScrapedInfo;
}

export interface LatencyStat {
  name: string;
  avgSec: number;
  percent: number;
}

export interface PhaseConfig {
  id: string;
  name: string;
  meta: string;
  allocation: string;
  prompt: string;
  tokensUsed: number;
  tokensMax: number;
}

export interface ModelsData {
  latency: LatencyStat[];
  phases: PhaseConfig[];
  retryCount: number;
  autoEmbeddings: boolean;
  systemNodeInfo: {
    node: string;
    ip: string;
  };
}

export interface PipelinePhaseMetric {
  label: string;
  completed: boolean | "spinning" | "fail" | "pause" | "done_all";
}

export interface PipelinePhase {
  id: string;
  number: string;
  title: string;
  indicatorColor: string;
  progress: number;
  status: "completed" | "running" | "critical";
  metrics: PipelinePhaseMetric[];
  liftLabel: string;
  liftPercent: number;
}

export interface PipelineLog {
  time: string;
  level: string;
  message: string;
}

export interface PipelineData {
  mainMeta: {
    nodeId: string;
    elapsedTime: string;
    memoryAllocated: string;
    memoryMax: string;
  };
  phases: PipelinePhase[];
  logs: PipelineLog[];
}

export interface EtfHoldingsItem {
  name: string;
  weight: number;
}

export interface EtfItem {
  symbol: string;
  name: string;
  segment: string;
  aum: string;
  expenseRatio: string;
  rating: string;
  price: number;
  changeToday: number;
  rsi: number;
  holdings: EtfHoldingsItem[];
  riskAnalysis?: string;
  alphaScore: number;
}

export interface CleanEtfRow {
  name: string;
  ticker: string;
  price: string;
  change: string;
  three_year_return: string;
  volume: string;
  logo_url?: string;
  detail_url?: string;
}

export interface CleanPageData {
  category: string;
  url: string;
  fetched_at: string;
  columns: string[];
  rows: CleanEtfRow[];
}

export interface EtfsData {
  etfs: EtfItem[];
  globalFlowStatus: string;
  lastUpdated: string;
  scrapedCategories?: CleanPageData[];
  lastScrapedAt?: string;
}

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
  market_cap_cr: number;
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

// MoneyControl World Article
export interface MoneycontrolWorldArticle {
  title: string;
  url?: string;
  summary?: string;
  image_url?: string;
  timestamp?: string;
  category?: string;
  source?: string;
}

// MoneyControl World Data
export interface MoneycontrolWorldData {
  fetched_at: string;
  source: string;
  url: string;
  featured_articles: MoneycontrolWorldArticle[];
  latest_news: MoneycontrolWorldArticle[];
  market_updates: MoneycontrolWorldArticle[];
}

// MoneyControl Earnings Company (Playwright)
export interface MoneycontrolEarningsCompany {
  name: string;
  symbol?: string;
  result_date: string;
  sector?: string;
  ltp?: number;
  change_pct?: number;
  revenue?: string;
  net_profit?: string;
  yoy_growth?: string;
}

// MoneyControl Earnings Data (Playwright)
export interface MoneycontrolEarningsData {
  fetched_at: string;
  source: string;
  upcoming_results: MoneycontrolEarningsCompany[];
  declared_results: MoneycontrolEarningsCompany[];
  top_performers: MoneycontrolEarningsCompany[];
  news_headlines: { title: string; url?: string; timestamp?: string }[];
}

