async function run() {
  const cases = [
    "ind_nifty500list.csv",
    "ind_nifty500List.csv",
    "ind_Nifty500list.csv",
    "Ind_nifty500list.csv",
    "ind_nifty500list.CSV",
    "ind_nifty500List.CSV",
    "Nifty500.csv",
    "nifty500.csv"
  ];
  for (const c of cases) {
    const url = `https://raw.githubusercontent.com/swing-is-king/backtest_stocks/master/${c}`;
    try {
      const res = await fetch(url);
      console.log(`Casing: ${c} -> Status: ${res.status}`);
      if (res.ok) {
        console.log("Found working casing:", c);
        return;
      }
    } catch (e: any) {
      console.log("Error:", e.message);
    }
  }
}

run();
