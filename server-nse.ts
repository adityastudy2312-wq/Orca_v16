import { NSE } from 'nse-bse-api';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PATH_NSE_DATA = path.join(DATA_DIR, "data-nse.json");
const PATH_NSE_QUOTE = path.join(DATA_DIR, "data-nse-quote.json");

let nseInstance: NSE | null = null;

async function getNSE(): Promise<NSE> {
  if (!nseInstance) {
    nseInstance = new NSE(path.join(DATA_DIR, 'nse_downloads'));
  }
  return nseInstance;
}

export async function closeNSE() {
  if (nseInstance) {
    try {
      await (nseInstance as any).exit?.();
    } catch {}
    nseInstance = null;
  }
}

export interface NSEQuote {
  symbol: string;
  company: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  yearHigh: number;
  yearLow: number;
  pe: number;
  eps: number;
  marketCap: number;
  fetched_at: string;
}

export interface NSEMarketStatus {
  market: string;
  status: string;
  tradeDate: string;
  openTime?: string;
  closeTime?: string;
}

export interface NSEIPO {
  name: string;
  symbol?: string;
  openDate: string;
  closeDate: string;
  issuePrice?: string;
  issueSize?: string;
  lotSize?: string;
  listingDate?: string;
  status: string;
}

export interface NSEOptionChain {
  symbol: string;
  expiryDate: string;
  strikePrice: number;
  callOI: number;
  callOIChange: number;
  callVolume: number;
  callLTP: number;
  putOI: number;
  putOIChange: number;
  putVolume: number;
  putLTP: number;
}

export interface NSECorporateAction {
  symbol: string;
  company: string;
  faceValue: number;
  exDate: string;
  recordDate: string;
  dividend: number;
  dividendType: string;
}

export interface NSEData {
  fetched_at: string;
  source: string;
  market_status: NSEMarketStatus | null;
  top_gainers: NSEQuote[];
  top_losers: NSEQuote[];
  ipos: NSEIPO[];
  announcements: { symbol: string; announcement: string; date: string }[];
}

export async function fetchNSEMarketStatus(): Promise<NSEMarketStatus | null> {
  try {
    const nse = await getNSE();
    const status = await nse.market.getStatus();
    return {
      market: status?.market || "NSE",
      status: status?.marketStatus || "Unknown",
      tradeDate: status?.tradeDate || new Date().toISOString(),
    };
  } catch (err: any) {
    console.error("[NSE] Market status error:", err.message);
    return null;
  }
}

export async function fetchNSEQuote(symbol: string): Promise<NSEQuote | null> {
  try {
    const nse = await getNSE();
    const quote = await nse.equityQuote(symbol);

    if (!quote) return null;

    const data: NSEQuote = {
      symbol: symbol.toUpperCase(),
      company: quote?.info?.companyName || symbol,
      price: parseFloat(quote?.priceInfo?.lastPrice) || 0,
      change: parseFloat(quote?.priceInfo?.change) || 0,
      changePercent: parseFloat(quote?.priceInfo?.pChange) || 0,
      open: parseFloat(quote?.priceInfo?.open) || 0,
      high: parseFloat(quote?.priceInfo?.intraDayHighLow?.max) || 0,
      low: parseFloat(quote?.priceInfo?.intraDayHighLow?.min) || 0,
      previousClose: parseFloat(quote?.priceInfo?.previousClose) || 0,
      volume: parseInt(quote?.securityWiseDP?.tradeInfo?.totalTradedVolume) || 0,
      yearHigh: parseFloat(quote?.priceInfo?.weekHighLow?.max) || 0,
      yearLow: parseFloat(quote?.priceInfo?.weekHighLow?.min) || 0,
      pe: parseFloat(quote?.metadata?.pdSymbolPE) || 0,
      eps: parseFloat(quote?.metadata?.totalEPS) || 0,
      marketCap: parseFloat(quote?.securityWiseDP?.tradeInfo?.totalMarketCap) || 0,
      fetched_at: new Date().toISOString(),
    };

    // Save to cache
    fs.writeFileSync(PATH_NSE_QUOTE, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  } catch (err: any) {
    console.error(`[NSE] Quote error for ${symbol}:`, err.message);
    return null;
  }
}

export async function fetchNSEIPOs(): Promise<NSEIPO[]> {
  try {
    const nse = await getNSE();
    const ipos = await nse.ipo.listCurrentIPO();

    if (!Array.isArray(ipos)) return [];

    return ipos.slice(0, 20).map((ipo: any) => ({
      name: ipo?.companyName || ipo?.object?.name || "Unknown",
      symbol: ipo?.symbol,
      openDate: ipo?.issueStartDate || "",
      closeDate: ipo?.issueEndDate || "",
      issuePrice: ipo?.priceRange || ipo?.object?.priceRange,
      issueSize: ipo?.issueSize || ipo?.object?.issueSize,
      lotSize: ipo?.lotSize || ipo?.object?.lotSize,
      listingDate: ipo?.listingDate,
      status: ipo?.status || "Open",
    }));
  } catch (err: any) {
    console.error("[NSE] IPO fetch error:", err.message);
    return [];
  }
}

export async function fetchNSEOptionChain(symbol: string = 'NIFTY'): Promise<NSEOptionChain[]> {
  try {
    const nse = await getNSE();
    const chain = await nse.options.getOptionChain(symbol);

    if (!chain?.records?.data) return [];

    return chain.records.data.slice(0, 30).map((row: any) => ({
      symbol: symbol,
      expiryDate: row?.expiryDate || "",
      strikePrice: row?.strikePrice || 0,
      callOI: row?.CE?.openInterest || 0,
      callOIChange: row?.CE?.changeinOpenInterest || 0,
      callVolume: row?.CE?.totalTradedVolume || 0,
      callLTP: row?.CE?.lastPrice || 0,
      putOI: row?.PE?.openInterest || 0,
      putOIChange: row?.PE?.changeinOpenInterest || 0,
      putVolume: row?.PE?.totalTradedVolume || 0,
      putLTP: row?.PE?.lastPrice || 0,
    }));
  } catch (err: any) {
    console.error(`[NSE] Option chain error for ${symbol}:`, err.message);
    return [];
  }
}

export async function fetchNSECorporateActions(): Promise<NSECorporateAction[]> {
  try {
    const nse = await getNSE();
    const actions = await nse.corporate.getActions({});

    if (!Array.isArray(actions)) return [];

    return actions.slice(0, 30).map((action: any) => ({
      symbol: action?.symbol || action?.symbolPkId?.symbol || "",
      company: action?.companyName || "",
      faceValue: action?.faceValue || 0,
      exDate: action?.exDate || action?.exDateNew || "",
      recordDate: action?.recordDate || "",
      dividend: action?.dividend || 0,
      dividendType: action?.dividendType || "Dividend",
    }));
  } catch (err: any) {
    console.error("[NSE] Corporate actions error:", err.message);
    return [];
  }
}

export async function scrapeAllNSEData(): Promise<NSEData> {
  console.log(`[NSE] Starting full scrape...`);

  const data: NSEData = {
    fetched_at: new Date().toISOString(),
    source: "NSE India",
    market_status: null,
    top_gainers: [],
    top_losers: [],
    ipos: [],
    announcements: [],
  };

  try {
    // Fetch market status
    data.market_status = await fetchNSEMarketStatus();

    // Fetch IPOs
    data.ipos = await fetchNSEIPOs();

    // Get quotes for some popular stocks as sample gainers/losers
    const watchlist = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'LT', 'AXISBANK'];
    const quotes: NSEQuote[] = [];

    for (const symbol of watchlist.slice(0, 5)) {
      const quote = await fetchNSEQuote(symbol);
      if (quote) quotes.push(quote);
    }

    // Sort by change percent for gainers/losers
    const sorted = quotes.sort((a, b) => b.changePercent - a.changePercent);
    data.top_gainers = sorted.filter(q => q.changePercent > 0).slice(0, 5);
    data.top_losers = sorted.filter(q => q.changePercent < 0).reverse().slice(0, 5);

    // Save to cache
    fs.writeFileSync(PATH_NSE_DATA, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[NSE] Scraped: status=${!!data.market_status}, ipos=${data.ipos.length}, gainers=${data.top_gainers.length}`);

    return data;
  } catch (err: any) {
    console.error("[NSE] Full scrape error:", err.message);
    return data;
  }
}

export function loadCachedNSEData(): NSEData | null {
  try {
    if (fs.existsSync(PATH_NSE_DATA)) {
      return JSON.parse(fs.readFileSync(PATH_NSE_DATA, 'utf-8'));
    }
  } catch {}
  return null;
}
