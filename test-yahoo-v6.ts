async function runTest() {
  const symbol = "RELIANCE.NS";
  const url = `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${symbol}`;
  console.log("Fetching from URL:", url);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });
    console.log("Status:", res.status);
    const json: any = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch (err: any) {
    console.error("Fail:", err.message);
  }
}

runTest();
