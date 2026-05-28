async function run() {
  const url = "https://nsearchives.nseindia.com/content/indices/ind_nifty500list.csv";
  console.log("Testing NSE Archives URL:", url);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    });
    console.log("Status:", res.status);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      console.log(`Success! Total lines: ${lines.length}`);
      console.log("Header:", lines[0]);
      console.log("Line 1:", lines[1]);
      console.log("Line 2:", lines[2]);
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

run();
