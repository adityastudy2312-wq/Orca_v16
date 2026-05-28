import { NSE } from "nse-bse-api";
import path from "path";

async function run() {
  const tempDir = path.join(process.cwd(), "temp_test_nse");
  const nse = new NSE(tempDir);
  try {
    const url = "https://www.nseindia.com/api/equity-stock-indices";
    const params = { index: "NIFTY 500" };
    // @ts-ignore
    const data = await nse.httpClient.request(url, params);
    if (data && data.data) {
      console.log("Total items:", data.data.length);
      console.log("Item 1 (index):", JSON.stringify(data.data[0], null, 2));
      console.log("Item 2:", JSON.stringify(data.data[1], null, 2));
      console.log("Item 3:", JSON.stringify(data.data[2], null, 2));
      console.log("Item 100:", JSON.stringify(data.data[99], null, 2));
    }
  } catch (err: any) {
    console.error(err.message);
  }
  nse.exit();
}

run();
