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

    await delay(3000); 

   
    const productDivs = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll("div"));
      return allDivs
        .map((div) => div.outerHTML)
        .filter(
          (html) =>
            html.includes("CatalogCard") || html.toLowerCase().includes("price")
        )
        .slice(0, 5); 
    });

    console.log("Potential product name/price divs");
    productDivs.forEach((html, idx) => {
      console.log(`DIV ${idx + 1}:\n${html}\n`);
    });

    return res.status(200).json({
      message: "First option clicked, logged potential product divs!",
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      message: "Something went wrong!",
      error: error,
    });
  }
});

export default router;
