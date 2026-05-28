async function testUrl(url: string) {
  try {
    const res = await fetch(url);
    console.log(`URL: ${url} -> Status: ${res.status}`);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      console.log(`  Success! Lines count: ${lines.length}`);
      console.log("  Header:", lines[0]);
      console.log("  Line 1:", lines[1]);
      console.log("  Line 2:", lines[2]);
      return true;
    }
  } catch (err: any) {
    console.log("Error:", err.message);
  }
  return false;
}

async function run() {
  const list = [
    "https://github.com/swing-is-king/backtest_stocks/raw/master/ind_nifty500list.csv",
    "https://github.com/SanjayShetty01/Nifty_Tracker_Deployment/raw/main/ind_nifty500list.csv",
    "https://github.com/Anand-Mishr/Nifty-indices-Tracker/raw/main/ind_nifty500list.csv",
    "https://github.com/devesh-paliwal/nifty-indices-tracker/raw/main/ind_nifty500list.csv"
  ];
  for (const url of list) {
    if (await testUrl(url)) {
      break;
    }
  }
}

run();
