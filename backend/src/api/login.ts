import { Router, Request, Response } from "express";
import { launchBrowser } from "../browser/puppeteer.js";
import { redisClient } from "../db/redis.js";
import { SessionModel } from "../db/mongo.js";

const router = Router();

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function screenshot(page: any, step: string) {
  try {
    await page.screenshot({
      path: `/app/screenshots/${step}.png`,
      fullPage: true,
    });
  } catch (err) {
    console.warn(`⚠️ Screenshot failed at ${step}:`, err);
  }
}

//Part 1 a done
router.post("/login", async (req: Request, res: Response) => {
  const { phone_number } = req.body;
  if (!phone_number) {
    return res.status(400).json({ error: "Phone number required" });
  }

  const { browser, page } = await launchBrowser();

  try {
    await page.goto("https://www.blinkit.com", { waitUntil: "networkidle2" });
    await screenshot(page, "1_home_loaded");

    await page.type('input[name="select-locality"]', "The Zero Mile Cafe", {
      delay: 100,
    });
    await page.waitForSelector(".location-show-addresses-v1", {
      timeout: 20000,
    });

    await page.evaluate(() => {
      const container = document.querySelector(".location-show-addresses-v1");
      const first = container?.querySelector("div, li") as HTMLElement | null;
      if (!first) throw new Error("No location suggestion found!");
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      first.click();
    });

    await delay(1500);
    await screenshot(page, "2_location_selected");

    const loginSelector = ".ProfileButton__Container-sc-975teb-3";
    await page.waitForSelector(loginSelector, { timeout: 15000 });
    await page.evaluate((selector) => {
      document.querySelector<HTMLElement>(selector)?.click();
    }, loginSelector);
    await screenshot(page, "3_login_clicked");

    const phoneInputSelector =
      'input[type="tel"], input[placeholder*="Enter"], input[name*="phone"]';
    await page.waitForSelector(phoneInputSelector, { timeout: 20000 });
    await page.type(phoneInputSelector, phone_number, { delay: 100 });
    await screenshot(page, "4_mobile_filled");

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.trim().includes("Continue")
      ) as HTMLElement | null;
      btn?.click();
    });

    await screenshot(page, "5_continue_clicked");

    const cookies = await page.cookies();

    const localStorageData = await page.evaluate(() => {
      return Object.fromEntries(
        Object.entries(localStorage).map(([k, v]) => [k, v as string])
      );
    });

    const sessionStorageData = await page.evaluate(() => {
      return Object.fromEntries(
        Object.entries(sessionStorage).map(([k, v]) => [k, v as string])
      );
    });

    const sessionData = {
      phone_number,
      cookies,
      localStorage: localStorageData,
      sessionStorage: sessionStorageData,
      currentURL: page.url(),
      createdAt: new Date(),
    };

    await redisClient.set(
      `session:${phone_number}`,
      JSON.stringify(sessionData),
      {
        EX: 600, 
      }
    );

    await SessionModel.create(sessionData);

    console.log("Session saved");
    res.json({ status: "OTP_SENT" });
  } catch (err: any) {
    console.error("Login flow error:", err.message);
    res.status(500).json({ error: "Login failed" });
  } finally {
    await browser.close();
  }
});

router.post("/submit-otp", async (req: Request, res: Response) => {
  const { phone_number } = req.body;
  if (!phone_number) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  const sessionStr = await redisClient.get(`session:${phone_number}`);
  if (!sessionStr) {
    return res.status(404).json({ error: "Session not found" });
  }

  const session = JSON.parse(sessionStr);
  const { browser, page } = await launchBrowser();

  try {
    await page.goto(session.currentURL || "https://www.blinkit.com", {
      waitUntil: "networkidle2",
    });

    await page.setCookie(...session.cookies);

    await page.evaluate(
      (
        localData: Record<string, string>,
        sessionData: Record<string, string>
      ) => {
        Object.entries(localData).forEach(([k, v]) =>
          localStorage.setItem(k, v)
        );
        Object.entries(sessionData).forEach(([k, v]) =>
          sessionStorage.setItem(k, v)
        );
      },
      session.localStorage,
      session.sessionStorage
    );

    await page.reload({ waitUntil: "networkidle2" });

    await screenshot(page, `otp_screen_${phone_number}`);
    console.log("Screenshot captured after OTP page loaded");

    res.json({ status: "SCREENSHOT_CAPTURED" });
  } catch (err: any) {
    console.error("OTP submit error:", err.message);
    res.status(500).json({ error: "Failed to capture OTP screen" });
  } finally {
    await browser.close();
  }
});

export default router;
