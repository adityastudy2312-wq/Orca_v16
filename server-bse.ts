import { BSE } from 'nse-bse-api';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PATH_BSE_DATA = path.join(DATA_DIR, "data-bse.json");

let bseInstance: BSE | null = null;

async function getBSE(): Promise<BSE> {
  if (!bseInstance) {
    bseInstance = new BSE({
      downloadFolder: path.join(DATA_DIR, 'bse_downloads'),
    });
  }
  return bseInstance;
}

export async function closeBSE() {
  if (bseInstance) {
    try {
      await (bseInstance as any).close?.();
    } catch {}
    bseInstance = null;
  }
}

export interface BSEQuote {
  scripCode: string;
  symbol?: string;
  company: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  yearHigh?: number;
  yearLow?: number;
  fetched_at: string;
}

export interface BSEGainerLoser {
  scripCode: string;
  symbol?: string;
  company: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}

export interface BSEResultCalendar {
  company: string;
  scripCode?: string;
  boardMeetingDate: string;
  resultDate?: string;
  purpose?: string;
}

export interface BSECorporateAction {
  company: string;
  scripCode: string;
  exDate: string;
  type: string;
  amount?: number;
  faceValue?: number;
  recordDate?: string;
}

export interface BSEAnnouncement {
  company: string;
  scripCode: string;
  announcement: string;
  date: string;
  category?: string;
}

export interface BSEData {
  fetched_at: string;
  source: string;
  top_gainers: BSEGainerLoser[];
  top_losers: BSEGainerLoser[];
  result_calendar: BSEResultCalendar[];
  corporate_actions: BSECorporateAction[];
  announcements: BSEAnnouncement[];
}

export async function fetchBSEGainers(): Promise<BSEGainerLoser[]> {
  try {
    const bse = await getBSE();
    const gainers = await bse.gainers();

    if (!Array.isArray(gainers)) return [];

    return gainers.slice(0, 15).map((g: any) => ({
      scripCode: g?.scripCode || g?.scrip_cd || "",
      symbol: g?.symbol,
      company: g?.companyName || g?.company || g?.scripname || "",
      price: parseFloat(g?.closingPrice || g?.ltp || g?.price) || 0,
      change: parseFloat(g?.change) || 0,
      changePercent: parseFloat(g?.pChange || g?.perChange) || 0,
      volume: parseInt(g?.totalTradedQty) || 0,
    }));
  } catch (err: any) {
    console.error("[BSE] Gainers error:", err.message);
    return [];
  }
}

export async function fetchBSELosers(): Promise<BSEGainerLoser[]> {
  try {
    const bse = await getBSE();
    const losers = await bse.losers();

    if (!Array.isArray(losers)) return [];

    return losers.slice(0, 15).map((l: any) => ({
      scripCode: l?.scripCode || l?.scrip_cd || "",
      symbol: l?.symbol,
      company: l?.companyName || l?.company || l?.scripname || "",
      price: parseFloat(l?.closingPrice || l?.ltp || l?.price) || 0,
      change: parseFloat(l?.change) || 0,
      changePercent: parseFloat(l?.pChange || l?.perChange) || 0,
      volume: parseInt(l?.totalTradedQty) || 0,
    }));
  } catch (err: any) {
    console.error("[BSE] Losers error:", err.message);
    return [];
  }
}

export async function fetchBSEResultCalendar(): Promise<BSEResultCalendar[]> {
  try {
    const bse = await getBSE();

    // Try to get result calendar data
    const actions = await bse.actions({
      fromDate: new Date(),
      toDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    if (!Array.isArray(actions)) return [];

    return actions.slice(0, 30).map((a: any) => ({
      company: a?.companyName || a?.company || "",
      scripCode: a?.scripCode || a?.scrip_cd || "",
      boardMeetingDate: a?.boardMeetingDate || a?.exDate || "",
      resultDate: a?.resultDate,
      purpose: a?.purpose || "Board Meeting",
    }));
  } catch (err: any) {
    console.error("[BSE] Result calendar error:", err.message);
    return [];
  }
}

export async function fetchBSECorporateActions(): Promise<BSECorporateAction[]> {
  try {
    const bse = await getBSE();
    const actions = await bse.actions({
      fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      toDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    });

    if (!Array.isArray(actions)) return [];

    return actions.slice(0, 30).map((a: any) => ({
      company: a?.companyName || a?.company || "",
      scripCode: a?.scripCode || a?.scrip_cd || "",
      exDate: a?.exDate || "",
      type: a?.actionType || a?.purpose || "Corporate Action",
      amount: parseFloat(a?.amount) || 0,
      faceValue: a?.faceValue ? parseFloat(a?.faceValue) : undefined,
      recordDate: a?.recordDate,
    }));
  } catch (err: any) {
    console.error("[BSE] Corporate actions error:", err.message);
    return [];
  }
}

export async function fetchBSEAnnouncements(): Promise<BSEAnnouncement[]> {
  try {
    const bse = await getBSE();
    const announcements = await bse.announcements({});

    if (!Array.isArray(announcements)) return [];

    return announcements.slice(0, 20).map((a: any) => ({
      company: a?.companyName || a?.company || "",
      scripCode: a?.scripCode || a?.scrip_cd || "",
      announcement: a?.announcement || a?.news || "",
      date: a?.date || a?.createdDate || new Date().toISOString(),
      category: a?.category,
    }));
  } catch (err: any) {
    console.error("[BSE] Announcements error:", err.message);
    return [];
  }
}

export async function fetchBSEQuote(scripCode: string): Promise<BSEQuote | null> {
  try {
    const bse = await getBSE();
    const quote = await bse.quote(scripCode);

    if (!quote) return null;

    return {
      scripCode: scripCode,
      symbol: quote?.symbol,
      company: quote?.companyName || quote?.company || "",
      price: parseFloat(quote?.currentValue || quote?.ltp) || 0,
      change: parseFloat(quote?.change) || 0,
      changePercent: parseFloat(quote?.pChange || quote?.perChange) || 0,
      open: parseFloat(quote?.open) || 0,
      high: parseFloat(quote?.high) || 0,
      low: parseFloat(quote?.low) || 0,
      previousClose: parseFloat(quote?.previousClose) || 0,
      volume: parseInt(quote?.totalTradedQty) || 0,
      yearHigh: quote?.weekHighLow?.max ? parseFloat(quote.weekHighLow.max) : undefined,
      yearLow: quote?.weekHighLow?.min ? parseFloat(quote.weekHighLow.min) : undefined,
      fetched_at: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error(`[BSE] Quote error for ${scripCode}:`, err.message);
    return null;
  }
}

export async function scrapeAllBSEData(): Promise<BSEData> {
  console.log(`[BSE] Starting full scrape...`);

  const data: BSEData = {
    fetched_at: new Date().toISOString(),
    source: "BSE India",
    top_gainers: [],
    top_losers: [],
    result_calendar: [],
    corporate_actions: [],
    announcements: [],
  };

  try {
    // Fetch all data in parallel where possible
    const [gainers, losers, resultCal, actions, announcements] = await Promise.all([
      fetchBSEGainers(),
      fetchBSELosers(),
      fetchBSEResultCalendar(),
      fetchBSECorporateActions(),
      fetchBSEAnnouncements(),
    ]);

    data.top_gainers = gainers;
    data.top_losers = losers;
    data.result_calendar = resultCal;
    data.corporate_actions = actions;
    data.announcements = announcements;

    // Save to cache
    fs.writeFileSync(PATH_BSE_DATA, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[BSE] Scraped: gainers=${gainers.length}, losers=${losers.length}, calendar=${resultCal.length}, actions=${actions.length}`);

    return data;
  } catch (err: any) {
    console.error("[BSE] Full scrape error:", err.message);
    return data;
  }
}

export function loadCachedBSEData(): BSEData | null {
  try {
    if (fs.existsSync(PATH_BSE_DATA)) {
      return JSON.parse(fs.readFileSync(PATH_BSE_DATA, 'utf-8'));
    }
  } catch {}
  return null;
}
