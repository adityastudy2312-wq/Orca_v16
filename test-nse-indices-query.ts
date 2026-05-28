import { NSE } from "nse-bse-api";
import path from "path";

async function runTest() {
  const tempDir = path.join(process.cwd(), "temp_test_nse");
  const nse = new NSE(tempDir);
  const formats = [
    "NIFTY 50",
    "NIFTY 100",
    "NIFTY 500",
    "nifty 50",
    "NIFTY50",
    "NIFTY500",
    "nifty50",
    "nifty500"
  ];
  for (const fmt of formats) {
    try {
      console.log(`Querying listEquityStocksByIndex('${fmt}')...`);
      const data = await nse.listEquityStocksByIndex(fmt);
      if (data && data.data) {
        console.log(`  Success! Found ${data.data.length} stocks for fmt: ${fmt}`);
        console.log("  Sample stock:", JSON.stringify(data.data[0], null, 2));
        break;
      }
    } catch (err: any) {
      console.log(`  Failed for '${fmt}':`, err.message);
    }
  }
  nse.exit();
}

runTest();
