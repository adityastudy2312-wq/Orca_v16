async function testKnown() {
  const url = "https://raw.githubusercontent.com/lodash/lodash/main/package.json";
  try {
    const res = await fetch(url);
    console.log(`Known lodash package.json status: ${res.status}`);
    if (res.ok) {
      const json = await res.json();
      console.log("Success! Name:", json.name);
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
testKnown();
