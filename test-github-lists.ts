async function testList(url: string) {
  try {
    const res = await fetch(url);
    console.log(`URL: ${url} -> Status: ${res.status}`);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split("\n").filter(Boolean);
      console.log(`Loaded ${lines.length} lines. First line: ${lines[0]}, Second line: ${lines[1]}`);
    }
  } catch (err: any) {
    console.error(`Failed ${url}:`, err.message);
  }
}

async function run() {
  await testList("https://raw.githubusercontent.com/Anand-Mishr/Nifty-indices-Tracker/main/ind_nifty100list.csv");
  await testList("https://raw.githubusercontent.com/Anand-Mishr/Nifty-indices-Tracker/main/ind_niftymidcap150list.csv");
  await testList("https://raw.githubusercontent.com/Anand-Mishr/Nifty-indices-Tracker/main/ind_niftysmallcap250list.csv");
}

run();
