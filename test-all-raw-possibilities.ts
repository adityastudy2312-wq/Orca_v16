async function testUrl(url: string) {
  try {
    const res = await fetch(url);
    console.log(`URL: ${url} -> Status: ${res.status}`);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      console.log(`  Success! Lines count: ${lines.length}`);
      console.log("  Sample Header:", lines[0]);
      console.log("  Sample Row 1:", lines[1]);
      return true;
    }
  } catch (err: any) {
    console.log(`  Fetch exception for ${url}:`, err.message);
  }
  return false;
}

async function run() {
  const list = [
    "https://raw.githubusercontent.com/swing-is-king/backtest_stocks/main/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/swing-is-king/backtest_stocks/master/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/Anand-Mishra/Nifty-indices-Tracker/main/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/Anand-Mishra/Nifty-indices-Tracker/master/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/yashchavda/Stock_Selection_App/main/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/yashchavda/Stock_Selection_App/master/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/devesh-paliwal/nifty-indices-tracker/main/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/devesh-paliwal/nifty-indices-tracker/master/ind_nifty500list.csv"
  ];
  for (const url of list) {
    if (await testUrl(url)) {
      break;
    }
  }
}

run();
