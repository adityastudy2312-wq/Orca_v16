import fs from "fs";
import path from "path";

function splitCsvLine(line: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current.trim().replace(/^"|"$/g, ""));
  return parts;
}

function parseNifty500Csv(csvText: string): { symbol: string; name: string; sector: string }[] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase().trim());
  const symbolIdx = headers.findIndex(h => h.includes("symbol"));
  const nameIdx = headers.findIndex(h => h.includes("company") || h.includes("name"));
  const sectorIdx = headers.findIndex(h => h.includes("industry") || h.includes("sector") || h.includes("industry"));

  const result: { symbol: string; name: string; sector: string }[] = [];
  
  if (symbolIdx !== -1 && nameIdx !== -1) {
    for (let i = 1; i < lines.length; i++) {
      const parts = splitCsvLine(lines[i]);
      const symbol = parts[symbolIdx]?.toUpperCase().trim();
      if (!symbol || symbol === "SYMBOL") continue;

      result.push({
        symbol,
        name: parts[nameIdx]?.trim() || symbol,
        sector: sectorIdx !== -1 ? parts[sectorIdx]?.trim() : "Other"
      });
    }
  }
  return result;
}

async function run() {
  const urls = [
    "https://raw.githubusercontent.com/devesh-paliwal/nifty-indices-tracker/main/ind_nifty500list.csv"
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`URL: ${url} -> Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        const parsed = parseNifty500Csv(text);
        console.log(`Successfully parsed ${parsed.length} stocks!`);
        console.log("First 3:", parsed.slice(0, 3));
        return;
      }
    } catch (err: any) {
      console.error(`Error for ${url}:`, err.message);
    }
  }
}

run();
