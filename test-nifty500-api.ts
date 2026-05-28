import { NSE } from "nse-bse-api";
import path from "path";

async function runTest() {
  const tempDir = path.join(process.cwd(), "temp_test_nse");
  const nse = new NSE(tempDir);
  try {
    console.log("Fetching listEquityStocksByIndex('NIFTY 500')...");
    const data = await nse.listEquityStocksByIndex("NIFTY 500");
    console.log("Data keys:", Object.keys(data));
    if (data && data.data) {
      console.log("Total stocks returned:", data.data.length);
      console.log("First stock details:", JSON.stringify(data.data[0], null, 2));
    }
  } catch (err: any) {
    console.error("Failed:", err.message);
  } finally {
    nse.exit();
  }
}

runTest();
