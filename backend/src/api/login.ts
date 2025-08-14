import { Router, Request, Response } from "express";
import { redisClient } from "../db/redis.js";
import { SessionModel } from "../db/mongo.js";
import {
  createBlinkitSession,
  getBlinkitSession,
} from "../utils/pageSessionManager.js";

const router = Router();

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function screenshot(page: any, step: string) {
  try {
    await page.screenshot({
      path: `/app/screenshots/${step}.png`,
      fullPage: true,
    });
  } catch (err) {
    console.warn(`Screenshot failed at ${step}:`, err);
  }
}

router.post("/login", async (req: Request, res: Response) => {
  const { phone_number } = req.body;
  if (!phone_number) {
    return res.status(400).json({ error: "Phone number required" });
  }

  const { page } = await createBlinkitSession(phone_number);

  try {
    await screenshot(page, "1_home_loaded");

    await page.type('input[name="select-locality"]', "The Zero Mile Cafe", {
      delay: 100,
    });

    await page.waitForSelector(
      ".location-addresses-v1 .LocationSearchList__LocationListContainer-sc-93rfr7-0",
      { timeout: 10000 }
    );

    // Click the first suggestion
    await page.evaluate(() => {
      const firstOption = document.querySelector(
        ".location-addresses-v1 .LocationSearchList__LocationListContainer-sc-93rfr7-0"
      ) as HTMLElement | null;

      if (!firstOption) throw new Error("No location suggestion found!");
      firstOption.scrollIntoView({ behavior: "smooth", block: "center" });
      firstOption.click();
    });

    await delay(1500);
    await screenshot(page, "2_location_selected");

    const loginSelector = ".ProfileButton__Container-sc-975teb-3";
    await page.waitForSelector(loginSelector, { timeout: 15000 });
    await page.evaluate((selector: string) => {
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

    res.json({ status: "OTP_SENT" });
  } catch (err: any) {
    console.error("Login flow error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/submit-otp", async (req: Request, res: Response) => {
  const { phone_number, otp } = req.body;

  if (!phone_number || !otp) {
    return res.status(400).json({ error: "Phone number and OTP required" });
  }

  const session = getBlinkitSession(phone_number);

  if (!session || !session.page) {
    return res.status(404).json({ error: "No active session for this number" });
  }

  const page = session.page;

  try {
    await screenshot(page, `otp_before_filling_${phone_number}`);

    await page.waitForSelector('input[data-test-id="otp-text-box"]', {
      timeout: 10000,
    });

    const otpInputs = await page.$$(
      'input[data-test-id="otp-text-box"][type="tel"]'
    );

    if (otpInputs.length === 0) {
      throw new Error("No OTP input fields detected.");
    }

    const otpDigits = otp
      .toString()
      .split("")
      .filter((d: string) => /^\d$/.test(d));

    if (otpDigits.length !== otpInputs.length) {
      throw new Error(
        `Expected ${otpInputs.length} OTP digits, but received ${otpDigits.length}.`
      );
    }

    const firstInput = otpInputs[0];
    if (!firstInput) {
      throw new Error("Input filed is missing!")
    }
    await firstInput.click({ clickCount: 2 });
    await firstInput.type(otpDigits.join(""));

    await screenshot(page, `otp_after_filling_${phone_number}`);

    await delay(1500);

    await screenshot(page, `otp_after_verification_${phone_number}`);

    await delay(1500);

    await screenshot(page, `otp_final_1${phone_number}`);

    const cookies = await page.cookies();
    const localStorageData = await page.evaluate(() =>
      Object.fromEntries(Object.entries(localStorage).map(([k, v]) => [k, v]))
    );
    const sessionStorageData = await page.evaluate(() =>
      Object.fromEntries(Object.entries(sessionStorage).map(([k, v]) => [k, v]))
    );

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
      { EX: 600 }
    );

    await SessionModel.create(sessionData);

    return res.json({ status: "OTP_FILLED" });
  } catch (err: any) {
    console.error("OTP submission error:", err.message);
    return res.status(500).json({ error: "OTP submission failed" });
  }
});

export default router;
