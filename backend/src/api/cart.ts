import { Router } from "express";
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
    console.warn(`⚠️ Screenshot failed at ${step}:`, err);
  }
}

router.post("/add-products", async (req, res) => {
  const { products_url, phone_number } = req.body;

  if (!products_url || !phone_number) {
    return res.status(400).json({
      error: "Phone number and Product URL is required.",
    });
  }

  const { page } = await createBlinkitSession(phone_number);

  try {
    await page.goto(products_url, { waitUntil: "domcontentloaded" });
    await delay(1000);
    await screenshot(page, "1_product_page_loaded");

    const buttons = await page.$$(`div[role='button']`);
    let addToCartBtn = null;

    for (const btn of buttons) {
      const text = await page.evaluate(
        (el: any) => el.textContent?.trim(),
        btn
      );
      if (text && text.toLowerCase().includes("add to cart")) {
        addToCartBtn = btn;
        break;
      }
    }

    if (addToCartBtn) {
      await addToCartBtn.click();
      await delay(1500);
      await screenshot(page, "2_product_added_to_cart");
    } else {
      await screenshot(page, "add_to_cart_not_found");
      throw new Error("Add to Cart button not found");
    }

    const cartBtn = await page.$("div[class*='CartButton__Button']");
    if (cartBtn) {
      await cartBtn.click();
      await delay(2000);
      await screenshot(page, "3_cart_opened");
    } else {
      throw new Error("Cart button not found");
    }

    const totalSelector = ".CheckoutStrip__PriceContainer-sc-1fzbdhy-10";
    await page.waitForSelector(totalSelector, { timeout: 5000 });

    const totalText = await page.$eval(totalSelector, (el: any) =>
      el.textContent?.trim()
    );

    const allMatches = await page.$$(totalSelector);
    for (let i = 0; i < allMatches.length; i++) {
      const text = await page.evaluate(
        (el: any) => el.textContent,
        allMatches[i]
      );
      const className = await page.evaluate(
        (el: any) => el.className,
        allMatches[i]
      );
      console.log(`[${i}] Text: ${text}`);
      console.log(`     Class: ${className}`);
    }

    // Extract ₹ amount
    const match = totalText.match(/₹\s*(\d+)/);
    const cartTotal = match ? parseInt(match[1]) : "Not found";

    return res.status(200).json({
      message: "Product added to cart successfully.",
      phone: phone_number,
      cartTotal,
    });
  } catch (error: any) {
    console.error("❌ Product error:", error);
    return res.status(500).json({
      error: error.message || "Failed to add product to cart.",
    });
  }
});

export default router;
