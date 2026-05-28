import { scrapeNse500 } from "./server-nse500-scraper";

async function test_scraper() {
  console.log("Triggering scrapeNse500(true)...");
  try {
    const data = await scrapeNse500(true);
    console.log("=== Success ===");
    console.log(`Fetched At: ${data.fetched_at}`);
    console.log(`Total Stocks: ${data.total_stocks}`);
    console.log(`Advances: ${data.advances}`);
    console.log(`Declines: ${data.declines}`);
    console.log(`Unchanged: ${data.unchanged}`);
    console.log(`Avg Daily Change %: ${data.avg_change_pct}%`);
    
    // Categorize samples
    const largeCaps = data.stocks.filter(s => s.cap_type === "Large Cap");
    const midCaps = data.stocks.filter(s => s.cap_type === "Mid Cap");
    const smallCaps = data.stocks.filter(s => s.cap_type === "Small Cap");
    
    console.log(`Count - Large Cap: ${largeCaps.length}, Mid Cap: ${midCaps.length}, Small Cap: ${smallCaps.length}`);
    
    console.log("\nSample Large Cap Stock:", JSON.stringify(largeCaps[0], null, 2));
    console.log("\nSample Mid Cap Stock:", JSON.stringify(midCaps[0], null, 2));
    console.log("\nSample Small Cap Stock:", JSON.stringify(smallCaps[0], null, 2));
  } catch (err: any) {
    console.error("Scraper Error:", err.message);
  }
}

test_scraper();
