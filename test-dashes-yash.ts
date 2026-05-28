async function run() {
  const url = "https://raw.githubusercontent.com/yashchavda/Stock-Selection-App/main/ind_nifty500list.csv";
  console.log("Testing:", url);
  try {
    const res = await fetch(url);
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
