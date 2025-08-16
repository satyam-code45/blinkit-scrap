import { Router } from "express";
import { createHyperPureSession } from "../utils/hyperpure.js";

const router = Router();

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function screenshot(page: any, step: string) {
  try {
    await page.screenshot({
      path: `/app/screenshots/1_hyperpure${step}.png`,
      fullPage: true,
    });
  } catch (err) {
    console.warn(`Screenshot failed at ${step}:`, err);
  }
}

router.post("/hyperpure", async (req, res) => {
  const { location, product } = req.body;

  if (!location || !product) {
    return res.status(400).json({ error: "Location and Product is required" });
  }

  const { page } = await createHyperPureSession({ location });

  try {
    await screenshot(page, "_1_params_home_loaded");

    await page.waitForSelector(".custom-input");
    await page.type("input", product);
    await screenshot(page, "_typed_product");

    const optionSelector = '#react-autowhatever-1 [role="option"]';
    await page.waitForSelector(optionSelector, { visible: true });

    await screenshot(page, "_options_loaded");

    const firstOption = await page.$(optionSelector);
    if (firstOption) {
      await firstOption.click();
      await screenshot(page, "_first_option_clicked");
    } else {
      throw new Error("No option found to click");
    }

    try {
      await page.waitForSelector(".CatalogCard_marginBottom24px__r_9vu", {
        visible: true,
        timeout: 10000,
      });
      await screenshot(page, "_results_page_loaded");
    } catch (e: any) {
      if (e.name === "TimeoutError") {
        console.log(
          "Selector not found, likely no products. Returning empty array."
        );
        return res.status(200).json({
          message: "Search completed, but no products were found.",
          products: [],
        });
      }
    }

    const products = await page.evaluate(() => {
      const productCards = document.querySelectorAll(
        ".CatalogCard_marginBottom24px__r_9vu"
      );

      const productData: { name: string; price: string }[] = [];

      productCards.forEach((card) => {
        const nameElement = card.querySelector(
          ".CatalogCard_truncate__dW5IB"
        ) as HTMLElement;
        const name = nameElement ? nameElement.innerText.trim() : null;

        const priceElement = card.querySelector(
          ".CatalogCard_price__Pf25D"
        ) as HTMLElement;
        const price = priceElement ? priceElement.innerText.trim() : null;

        if (name && price) {
          productData.push({ name, price });
        }
      });

      return productData;
    });

    console.log("Scraped Products:", products);

    return res.status(200).json({
      message: `Successfully scraped ${products.length} products.`,
      products: products,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong during the scraping process!",
      error: error.message,
    });
  }
});

export default router;
