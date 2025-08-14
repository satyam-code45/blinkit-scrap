import { launchBrowser } from "../browser/puppeteer.js";
import  { Browser, Page } from "puppeteer";

type Session = {
  browser: Browser;
  page: Page;
};

const sessions = new Map<string, Session>();

export async function createBlinkitSession(
  phone_number: string
): Promise<Session> {
  if (sessions.has(phone_number)) return sessions.get(phone_number)!;

  const { browser, page } = await launchBrowser();
  await page.goto("https://www.blinkit.com", { waitUntil: "networkidle2" });

  sessions.set(phone_number, { browser, page });
  return { browser, page };
}

export function getBlinkitSession(phone_number: string): Session | null {
  return sessions.get(phone_number) || null;
}

export async function closeBlinkitSession(phone_number: string) {
  const session = sessions.get(phone_number);
  if (session) {
    await session.browser.close();
    sessions.delete(phone_number);
  }
}
