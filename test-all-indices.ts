import { NSE } from "nse-bse-api";
import path from "path";

async function runTest() {
  const tempDir = path.join(process.cwd(), "temp_test_nse");
  const nse = new NSE(tempDir);
  try {
    const list = await nse.listIndices();
    console.log("Indices count:", list?.data?.length);
    if (list && list.data) {
      const names = list.data.map((idx: any) => idx.index || idx.indexSymbol);
      console.log("Names:", names);
    }
  } catch (err: any) {
    console.error("Failed:", err.message);
  } finally {
    nse.exit();
  }
}

runTest();
