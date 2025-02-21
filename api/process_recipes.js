const axios = require("axios");
const cheerio = require("cheerio");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

async function fetchRecipe(url) {
    try {
        let ingredients = [];

        if (url.includes("foodnetwork.com")) {
            console.log("Using Puppeteer for:", url);

            // Launch Puppeteer with custom Chromium
            const browser = await puppeteer.launch({
                args: chromium.args,
                executablePath: await chromium.executablePath(),
                headless: true
            });

            const page = await browser.newPage();

            // Set User-Agent to avoid detection
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );

            // Navigate to the page & wait
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

            // Extract ingredients
            ingredients = await page.evaluate(() => {
                return Array.from(document.querySelectorAll(".ingredients-item"))
                    .map(el => el.innerText.trim());
            });

            await browser.close();
        } else {
            console.log("Using Axios for:", url);

            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Referer": "https://www.google.com/",
                    "DNT": "1",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
                }
            });

            const html = response.data;
            const $ = cheerio.load(html);

            const selectors = [
                "li.ingredient",
                ".recipe-ingredients li",
                ".wprm-recipe-ingredient",
                ".tasty-recipes-ingredients li",
                ".ingredients-item",
                '[itemprop="recipeIngredient"]',
                ".structured-ingredients__list-item"
            ];

            for (const selector of selectors) {
                $(selector).each((i, el) => {
                    ingredients.push($(el).text().trim());
                });
                if (ingredients.length > 0) break;
            }
        }

        if (ingredients.length === 0) {
            console.log(`No ingredients found for: ${url}`);
            return { title: url, ingredients: ["No ingredients found"] };
        }

        console.log(`✅ Successfully fetched ingredients for: ${url}`);
        return { title: url, ingredients };

    } catch (error) {
        console.error(`❌ Error fetching recipe from ${url}:`, error.message);
        return { title: "Failed to fetch", ingredients: ["Error fetching recipe data"] };
    }
}

module.exports = async (req, res) => {
    const { links } = req.body;
    if (!links || !Array.isArray(links)) {
        return res.status(400).json({ error: "Invalid request format" });
    }

    const results = await Promise.all(links.map(url => fetchRecipe(url)));

    let consolidatedIngredients = {};
    results.forEach(recipe => {
        recipe.ingredients.forEach(ingredient => {
            consolidatedIngredients[ingredient] = (consolidatedIngredients[ingredient] || 0) + 1;
        });
    });

    let output = "Consolidated Ingredients:\n";
    for (const [ingredient, count] of Object.entries(consolidatedIngredients)) {
        output += `- ${ingredient} (x${count})\n`;
    }

    return res.status(200).json({ ingredients: output });
};
