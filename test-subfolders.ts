async function testUrl(url: string) {
  try {
    const res = await fetch(url);
    console.log(`URL: ${url} -> Status: ${res.status}`);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      console.log(`  Success! Lines count: ${lines.length}`);
      console.log("  Header:", lines[0]);
      console.log("  Line 1:", lines[1]);
      return true;
    }
  } catch {}
  return false;
}

async function run() {
  const list = [
    "https://raw.githubusercontent.com/SanjayShetty01/Nifty_Tracker_Deployment/master/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/shubh-dwivedi/Nifty-500-Stocks/master/Nifty500.csv",
    "https://raw.githubusercontent.com/Anand-Mishr/Nifty-Indices-Tracker/master/ind_nifty500list.csv",
    "https://raw.githubusercontent.com/Anand-Mishr/Nifty-Indices-Tracker/main/ind_nifty500list.csv"
  ];
  for (const url of list) {
    if (await testUrl(url)) {
      console.log("Found working URL:", url);
      break;
    }
  }
}

run();
