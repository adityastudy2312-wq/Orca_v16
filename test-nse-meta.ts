import { NSE } from "nse-bse-api";
import path from "path";

async function run() {
  const tempDir = path.join(process.cwd(), "temp_test_nse");
  const nse = new NSE(tempDir);
  try {
    console.log("Fetching equityMetaInfo for HDFCBANK...");
    const meta = await nse.equityMetaInfo("HDFCBANK");
    console.log("Success! Keys:", Object.keys(meta || {}));
    console.log("Meta Response:", JSON.stringify(meta, null, 2));
  } catch (err: any) {
    console.error("Failed:", err.message);
  }
  nse.exit();
}

run();
