async function runTest() {
  const symbols = "RELIANCE.NS,TCS.NS";
  const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${symbols}&range=1d&interval=5m`;
  console.log("Fetching from URL:", url);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });
    console.log("Status:", res.status);
    const json: any = await res.json();
    console.log("Spark Response:", JSON.stringify(json, null, 2));
  } catch (err: any) {
    console.error("Fail:", err.message);
  }
}

runTest();
