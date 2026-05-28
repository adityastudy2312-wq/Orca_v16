async function run() {
  const urls = [
    "https://raw.githubusercontent.com/Anand-Mishra/Nifty-indices-Tracker/main/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/Anand-Mishr/Nifty-indices-Tracker/main/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/Anand-Mishra/Nifty-indices-Tracker/master/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/Anand-Mishr/Nifty-indices-Tracker/master/ind_nifty500list.csv"
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`URL: ${url} -> Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        const lines = text.split("\n").filter(Boolean);
        console.log(`  Success! Found ${lines.length} lines.`);
        console.log("  Sample line 1:", lines[0]);
        console.log("  Sample line 2:", lines[1]);
        return;
      }
    } catch (err: any) {
      console.error(`Error for ${url}:`, err.message);
    }
  }
}

run();
