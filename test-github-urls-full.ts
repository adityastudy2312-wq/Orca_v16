async function testUrl(url: string) {
  try {
    const res = await fetch(url);
    console.log(`URL: ${url} -> Status: ${res.status}`);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      console.log(`  Success! Non-empty lines: ${lines.length}`);
      console.log("  Header:", lines[0]);
      console.log("  Line 1:", lines[1]);
      return true;
    }
  } catch (err: any) {
    console.error(`  Error:`, err.message);
  }
  return false;
}

async function run() {
  const urls = [
    "https://raw.githubusercontent.com/Sowmya-Murali/DataScienceProject/master/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/yashchavda/Stock_Selection_App/master/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/SanjayShetty01/Nifty_Tracker_Deployment/main/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/Anand-Mishr/Nifty-indices-Tracker/main/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/swing-is-king/backtest_stocks/master/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/Sowmya-Murali/DataScienceProject/main/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/yashchavda/Stock_Selection_App/main/ind_nifty500list.csv"
  ];
  for (const url of urls) {
    if (await testUrl(url)) {
      console.log("Found working url:", url);
      break;
    }
  }
}

run();
