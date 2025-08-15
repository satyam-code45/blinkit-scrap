import { launchBrowser } from "../browser/puppeteer.js";
import { Browser, Page } from "puppeteer";

type Session = {
  browser: Browser;
  page: Page;
};

export async function createHyperPureSession({
  location
}: {
  location: string;
}): Promise<Session> {
  const { browser, page } = await launchBrowser();
  const url = `https://www.hyperpure.com/ind/${location}/Menu-Addons`;
  await page.goto(url, { waitUntil: "networkidle2" });

  return { browser, page };
}
