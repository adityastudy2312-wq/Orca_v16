import { NSE } from "nse-bse-api";
import path from "path";

async function runTest() {
  const tempDir = path.join(process.cwd(), "temp_test_nse");
  const nse = new NSE(tempDir);
  const indexToTest = "NIFTY 500";
  try {
    console.log(`Querying /api/equity-stock-indices for index: ${indexToTest}...`);
    const url = "https://www.nseindia.com/api/equity-stock-indices";
    const params = { index: indexToTest };
    // @ts-ignore
    const data = await nse.httpClient.request(url, params);
    console.log(`Success! typeof data: ${typeof data}`);
    console.log(`Data keys:`, Object.keys(data || {}));
    if (data && data.data) {
      console.log(`Count of elements: ${data.data.length}`);
      console.log(`First item:`, JSON.stringify(data.data[0], null, 2));
    } else {
      console.log(`No .data property. Entire data slice:`, JSON.stringify(data).substring(0, 500));
    }
  } catch (err: any) {
    console.log(`Failed:`, err.message);
  }
  nse.exit();
}

runTest();
