import { execSync } from "child_process";
import puppeteer, { Browser, Page } from "puppeteer";

function findChromePath(): string | undefined {
  try {
    const path = execSync(
      "find /root/.cache/puppeteer/chrome -type f -name chrome | head -n 1"
    )
      .toString()
      .trim();
    return path || undefined;
  } catch {
    return undefined;
  }
}


export async function launchBrowser(): Promise<{ browser: Browser; page: Page }> {
  const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || findChromePath();

  console.log("Using Chrome binary:", chromePath || "NOT FOUND");

  if (!chromePath) {
    throw new Error("Chrome binary not found in container");
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138 Safari/537.36"
  );

  return { browser, page };
}
