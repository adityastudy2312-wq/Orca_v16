import fs from "fs";
import path from "path";

async function run() {
  const filePath = path.join(process.cwd(), "data-nse500.json");
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    console.log("Cached stocks length:", data?.stocks?.length);
    if (data?.stocks?.length > 0) {
      console.log("Cached sector distribution:");
      const sectors: Record<string, number> = {};
      data.stocks.forEach((s: any) => {
        sectors[s.sector] = (sectors[s.sector] || 0) + 1;
      });
      console.log(sectors);
    }
  } else {
    console.log("File does not exist!");
  }
}

run();
